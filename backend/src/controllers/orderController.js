import { z } from 'zod';
import { query, withTransaction } from '../config/db.js';
import { logAudit } from '../services/auditService.js';

const orderItemSchema = z.object({
  productId: z.string().uuid('Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1')
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  shipping: z.object({
    name: z.string().min(2, 'Recipient full name is required'),
    address: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().min(2, 'Postal code is required'),
    country: z.string().min(2, 'Country is required').default('United States'),
    phone: z.string().min(5, 'Contact phone is required')
  }),
  poReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  reason: z.string().optional()
});

export async function createOrder(req, res, next) {
  try {
    const parse = createOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parse.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const { items, shipping, poReference, notes } = parse.data;
    const customerId = req.user.id;

    const result = await withTransaction(async (client) => {
      // 1. Fetch requested product IDs
      const productIds = items.map((i) => i.productId);

      // Acquire exclusive row-level lock on products to prevent race conditions & overselling
      const productQuery = `
        SELECT id, sku, title, unit_price, stock, is_active
        FROM products
        WHERE id = ANY($1::uuid[])
        FOR UPDATE;
      `;
      const pRes = await client.query(productQuery, [productIds]);
      const productMap = new Map(pRes.rows.map((p) => [p.id, p]));

      // 2. Validate availability and stock
      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod || !prod.is_active) {
          throw {
            statusCode: 400,
            message: `Product with ID '${item.productId}' is unavailable or no longer active.`
          };
        }

        if (prod.stock < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for '${prod.title}' (SKU: ${prod.sku}). Available: ${prod.stock}, Requested: ${item.quantity}.`
          };
        }
      }

      // 3. Compute price breakdown strictly on backend
      let subtotal = 0;
      const computedItems = [];

      for (const item of items) {
        const prod = productMap.get(item.productId);
        const unitPrice = parseFloat(prod.unit_price);
        const lineTotal = +(unitPrice * item.quantity).toFixed(2);
        subtotal += lineTotal;

        computedItems.push({
          productId: prod.id,
          sku: prod.sku,
          title: prod.title,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        });

        // Deduct stock safely
        await client.query(
          `
          UPDATE products
          SET stock = stock - ($1::int), updated_at = NOW()
          WHERE id = $2;
          `,
          [item.quantity, prod.id]
        );
      }

      subtotal = +subtotal.toFixed(2);
      const taxRate = 0.0800; // 8% wholesale state commercial tax
      const taxAmount = +(subtotal * taxRate).toFixed(2);
      const totalAmount = +(subtotal + taxAmount).toFixed(2);

      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${new Date().getFullYear()}-${timestamp}${randomSuffix}`;

      // 4. Insert Order Record
      const orderRes = await client.query(
        `
        INSERT INTO orders (
          order_number, customer_id, status, subtotal, tax_rate, tax_amount, total_amount,
          shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
          contact_phone, po_reference, notes
        ) VALUES ($1, $2, 'PENDING', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
        `,
        [
          orderNumber,
          customerId,
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          shipping.name.trim(),
          shipping.address.trim(),
          shipping.city.trim(),
          shipping.postalCode.trim(),
          shipping.country.trim(),
          shipping.phone.trim(),
          poReference || null,
          notes || null
        ]
      );

      const createdOrder = orderRes.rows[0];

      // 5. Insert Order Items (with locked unit prices)
      for (const item of computedItems) {
        await client.query(
          `
          INSERT INTO order_items (order_id, product_id, product_title, sku, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
          `,
          [createdOrder.id, item.productId, item.title, item.sku, item.quantity, item.unitPrice, item.lineTotal]
        );
      }

      // 6. Generate Commercial Invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}${randomSuffix}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Net 30 wholesale payment terms

      const invoiceRes = await client.query(
        `
        INSERT INTO invoices (invoice_number, order_id, customer_id, issue_date, due_date, status, subtotal, tax_amount, total_amount)
        VALUES ($1, $2, $3, CURRENT_DATE, $4, 'ISSUED', $5, $6, $7)
        RETURNING *;
        `,
        [invoiceNumber, createdOrder.id, customerId, dueDate, subtotal, taxAmount, totalAmount]
      );

      // 7. Write Audit Trail Entry
      await logAudit({
        client,
        userId: customerId,
        action: 'ORDER_PLACED',
        entityType: 'ORDER',
        entityId: createdOrder.id,
        details: {
          orderNumber,
          invoiceNumber,
          totalAmount,
          itemCount: computedItems.length
        },
        ipAddress: req.ip
      });

      return {
        order: createdOrder,
        items: computedItems,
        invoice: invoiceRes.rows[0]
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Order successfully placed',
      data: result
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function getOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    // Role-based customer isolation: Customers only see their own orders!
    if (req.user.role === 'customer') {
      params.push(req.user.id);
      conditions.push(`o.customer_id = $${params.length}`);
    }

    if (status && status.trim()) {
      params.push(status.trim().toUpperCase());
      conditions.push(`o.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM orders o ${whereClause};`, params);
    const totalItems = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    params.push(limitNum);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const ordersQuery = `
      SELECT 
        o.id, o.order_number AS "orderNumber", o.status,
        o.subtotal, o.tax_rate AS "taxRate", o.tax_amount AS "taxAmount", o.total_amount AS "totalAmount",
        o.shipping_name AS "shippingName", o.shipping_city AS "shippingCity",
        o.po_reference AS "poReference", o.created_at AS "createdAt",
        u.company_name AS "companyName", u.email AS "customerEmail",
        inv.id AS "invoiceId", inv.invoice_number AS "invoiceNumber",
        COUNT(oi.id) AS "itemCount"
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN invoices inv ON o.id = inv.order_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.company_name, u.email, inv.id, inv.invoice_number
      ORDER BY o.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const ordersRes = await query(ordersQuery, params);

    return res.status(200).json({
      success: true,
      data: ordersRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const orderRes = await query(
      `
      SELECT 
        o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId", o.status,
        o.subtotal, o.tax_rate AS "taxRate", o.tax_amount AS "taxAmount", o.total_amount AS "totalAmount",
        o.shipping_name AS "shippingName", o.shipping_address AS "shippingAddress",
        o.shipping_city AS "shippingCity", o.shipping_postal_code AS "shippingPostalCode",
        o.shipping_country AS "shippingCountry", o.contact_phone AS "contactPhone",
        o.po_reference AS "poReference", o.notes, o.created_at AS "createdAt", o.updated_at AS "updatedAt",
        u.company_name AS "companyName", u.full_name AS "customerFullName", u.email AS "customerEmail",
        inv.id AS "invoiceId", inv.invoice_number AS "invoiceNumber", inv.due_date AS "invoiceDueDate", inv.status AS "invoiceStatus"
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN invoices inv ON o.id = inv.order_id
      WHERE o.id = $1;
      `,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // Customer Isolation Check: Customers must NOT access other customers' orders!
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view this order.'
      });
    }

    const itemsRes = await query(
      `
      SELECT 
        id, product_id AS "productId", product_title AS "productTitle",
        sku, quantity, unit_price AS "unitPrice", line_total AS "lineTotal"
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC;
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: itemsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const parse = updateStatusSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parse.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const { status: newStatus, reason } = parse.data;

    const result = await withTransaction(async (client) => {
      const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (orderRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Order not found' };
      }

      const order = orderRes.rows[0];

      // Role check: Customer can only cancel their own PENDING order
      if (req.user.role === 'customer') {
        if (order.customer_id !== req.user.id) {
          throw { statusCode: 403, message: 'You do not have permission to modify this order.' };
        }
        if (newStatus !== 'CANCELLED') {
          throw { statusCode: 403, message: 'Customers may only cancel pending orders.' };
        }
        if (order.status !== 'PENDING') {
          throw { statusCode: 400, message: `Cannot cancel order with status '${order.status}'. Only PENDING orders can be cancelled.` };
        }
      }

      // Valid state transition check
      const validTransitions = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: []
      };

      if (!validTransitions[order.status]?.includes(newStatus)) {
        throw {
          statusCode: 400,
          message: `Invalid status transition from '${order.status}' to '${newStatus}'.`
        };
      }

      // Handle stock replenishment if order is CANCELLED
      if (newStatus === 'CANCELLED') {
        const itemsRes = await client.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [id]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            `
            UPDATE products
            SET stock = stock + ($1::int), updated_at = NOW()
            WHERE id = $2;
            `,
            [item.quantity, item.product_id]
          );
        }

        // Cancel associated invoice
        await client.query(
          `UPDATE invoices SET status = 'CANCELLED' WHERE order_id = $1`,
          [id]
        );
      }

      const updateRes = await client.query(
        `
        UPDATE orders
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, order_number AS "orderNumber", status, updated_at AS "updatedAt";
        `,
        [newStatus, id]
      );

      await logAudit({
        client,
        userId: req.user.id,
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'ORDER',
        entityId: id,
        details: {
          orderNumber: order.order_number,
          previousStatus: order.status,
          newStatus,
          reason: reason || null
        },
        ipAddress: req.ip
      });

      return updateRes.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order: result
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const conditions = [];
    const params = [];

    if (req.user.role === 'customer') {
      params.push(req.user.id);
      conditions.push(`inv.customer_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const queryStr = `
      SELECT 
        inv.id, inv.invoice_number AS "invoiceNumber", inv.status,
        inv.issue_date AS "issueDate", inv.due_date AS "dueDate",
        inv.subtotal, inv.tax_amount AS "taxAmount", inv.total_amount AS "totalAmount",
        inv.created_at AS "createdAt",
        o.id AS "orderId", o.order_number AS "orderNumber",
        u.company_name AS "companyName", u.email AS "customerEmail"
      FROM invoices inv
      JOIN orders o ON inv.order_id = o.id
      JOIN users u ON inv.customer_id = u.id
      ${whereClause}
      ORDER BY inv.created_at DESC;
    `;

    const result = await query(queryStr, params);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;

    const invoiceRes = await query(
      `
      SELECT 
        inv.id, inv.invoice_number AS "invoiceNumber", inv.status,
        inv.issue_date AS "issueDate", inv.due_date AS "dueDate",
        inv.subtotal, inv.tax_amount AS "taxAmount", inv.total_amount AS "totalAmount",
        inv.created_at AS "createdAt",
        o.id AS "orderId", o.order_number AS "orderNumber", o.po_reference AS "poReference",
        o.shipping_name AS "shippingName", o.shipping_address AS "shippingAddress",
        o.shipping_city AS "shippingCity", o.shipping_postal_code AS "shippingPostalCode",
        o.shipping_country AS "shippingCountry", o.contact_phone AS "contactPhone",
        u.id AS "customerId", u.company_name AS "companyName", u.full_name AS "customerFullName", u.email AS "customerEmail", u.phone AS "customerPhone"
      FROM invoices inv
      JOIN orders o ON inv.order_id = o.id
      JOIN users u ON inv.customer_id = u.id
      WHERE inv.id = $1 OR inv.order_id = $1;
      `,
      [id]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // Ownership check
    if (req.user.role === 'customer' && invoice.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view this invoice.'
      });
    }

    const itemsRes = await query(
      `
      SELECT 
        id, product_title AS "productTitle", sku, quantity, unit_price AS "unitPrice", line_total AS "lineTotal"
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC;
      `,
      [invoice.orderId]
    );

    return res.status(200).json({
      success: true,
      invoice: {
        ...invoice,
        items: itemsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}
