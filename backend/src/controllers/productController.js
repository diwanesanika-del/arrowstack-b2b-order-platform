import { z } from 'zod';
import { query, withTransaction } from '../config/db.js';
import { logAudit } from '../services/auditService.js';

const productSchema = z.object({
  sku: z.string().min(2, 'SKU is required'),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional().default(''),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(1).default(10),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true)
});

const inventoryAdjustSchema = z.object({
  stockAdjustment: z.coerce.number().int('Adjustment must be an integer'),
  reason: z.string().min(3, 'A valid reason for inventory adjustment is required')
});

export async function getProducts(req, res, next) {
  try {
    const {
      search,
      category,
      stockStatus = 'all',
      sort = 'title_asc',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['is_active = true'];
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(title) LIKE $${params.length} OR LOWER(sku) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`);
    }

    if (category && category.trim()) {
      params.push(category.trim());
      conditions.push(`category = $${params.length}`);
    }

    if (stockStatus === 'in_stock') {
      conditions.push('stock > low_stock_threshold');
    } else if (stockStatus === 'low_stock') {
      conditions.push('stock > 0 AND stock <= low_stock_threshold');
    } else if (stockStatus === 'out_of_stock') {
      conditions.push('stock = 0');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'title ASC';
    if (sort === 'title_desc') orderBy = 'title DESC';
    if (sort === 'price_asc') orderBy = 'unit_price ASC';
    if (sort === 'price_desc') orderBy = 'unit_price DESC';
    if (sort === 'stock_desc') orderBy = 'stock DESC';
    if (sort === 'created_desc') orderBy = 'created_at DESC';

    // Count total matching items
    const countQuery = `SELECT COUNT(*) FROM products ${whereClause};`;
    const countRes = await query(countQuery, params);
    const totalItems = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Fetch paginated data
    params.push(limitNum);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const dataQuery = `
      SELECT 
        id, sku, title, description, category, unit_price AS "unitPrice",
        stock, low_stock_threshold AS "lowStockThreshold",
        image_url AS "imageUrl", is_active AS "isActive",
        created_at AS "createdAt",
        CASE
          WHEN stock = 0 THEN 'out_of_stock'
          WHEN stock <= low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END AS "stockStatus"
      FROM products
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const dataRes = await query(dataQuery, params);

    return res.status(200).json({
      success: true,
      data: dataRes.rows,
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

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `
      SELECT 
        id, sku, title, description, category, unit_price AS "unitPrice",
        stock, low_stock_threshold AS "lowStockThreshold",
        image_url AS "imageUrl", is_active AS "isActive",
        created_at AS "createdAt",
        CASE
          WHEN stock = 0 THEN 'out_of_stock'
          WHEN stock <= low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END AS "stockStatus"
      FROM products
      WHERE id = $1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      product: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const parse = productSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parse.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const { sku, title, description, category, unitPrice, stock, lowStockThreshold, imageUrl, isActive } = parse.data;

    const existing = await query('SELECT id FROM products WHERE sku = $1', [sku.toUpperCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `A product with SKU '${sku}' already exists.`
      });
    }

    const result = await query(
      `
      INSERT INTO products (sku, title, description, category, unit_price, stock, low_stock_threshold, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, sku, title, description, category, unit_price AS "unitPrice", stock, low_stock_threshold AS "lowStockThreshold", image_url AS "imageUrl", is_active AS "isActive";
      `,
      [sku.toUpperCase().trim(), title.trim(), description, category.trim(), unitPrice, stock, lowStockThreshold, imageUrl || null, isActive]
    );

    const createdProduct = result.rows[0];

    await logAudit({
      userId: req.user.id,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: createdProduct.id,
      details: { sku: createdProduct.sku, title: createdProduct.title, unitPrice, initialStock: stock },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: createdProduct
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const parse = productSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parse.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const currentRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const current = currentRes.rows[0];

    const updates = parse.data;
    const title = updates.title !== undefined ? updates.title.trim() : current.title;
    const description = updates.description !== undefined ? updates.description : current.description;
    const category = updates.category !== undefined ? updates.category.trim() : current.category;
    const unitPrice = updates.unitPrice !== undefined ? updates.unitPrice : current.unit_price;
    const stock = updates.stock !== undefined ? updates.stock : current.stock;
    const lowStockThreshold = updates.lowStockThreshold !== undefined ? updates.lowStockThreshold : current.low_stock_threshold;
    const imageUrl = updates.imageUrl !== undefined ? updates.imageUrl : current.image_url;
    const isActive = updates.isActive !== undefined ? updates.isActive : current.is_active;

    const result = await query(
      `
      UPDATE products
      SET title = $1, description = $2, category = $3, unit_price = $4, stock = $5, low_stock_threshold = $6, image_url = $7, is_active = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING id, sku, title, description, category, unit_price AS "unitPrice", stock, low_stock_threshold AS "lowStockThreshold", image_url AS "imageUrl", is_active AS "isActive";
      `,
      [title, description, category, unitPrice, stock, lowStockThreshold, imageUrl, isActive, id]
    );

    const updated = result.rows[0];

    await logAudit({
      userId: req.user.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: id,
      details: { previous: { price: current.unit_price, stock: current.stock }, updated },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function adjustInventory(req, res, next) {
  try {
    const { id } = req.params;
    const parse = inventoryAdjustSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parse.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const { stockAdjustment, reason } = parse.data;

    const result = await withTransaction(async (client) => {
      // Row lock the product to guarantee safe inventory change
      const pRes = await client.query('SELECT id, sku, title, stock FROM products WHERE id = $1 FOR UPDATE', [id]);
      if (pRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Product not found' };
      }

      const prod = pRes.rows[0];
      const newStock = prod.stock + stockAdjustment;

      if (newStock < 0) {
        throw {
          statusCode: 400,
          message: `Cannot adjust inventory by ${stockAdjustment}. Current stock is ${prod.stock}, which would result in negative inventory.`
        };
      }

      const updateRes = await client.query(
        `
        UPDATE products
        SET stock = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, sku, title, stock;
        `,
        [newStock, id]
      );

      await logAudit({
        client,
        userId: req.user.id,
        action: 'INVENTORY_ADJUSTMENT',
        entityType: 'PRODUCT',
        entityId: id,
        details: {
          sku: prod.sku,
          previousStock: prod.stock,
          adjustment: stockAdjustment,
          newStock,
          reason
        },
        ipAddress: req.ip
      });

      return {
        product: updateRes.rows[0],
        previousStock: prod.stock,
        newStock,
        reason
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: result
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}
