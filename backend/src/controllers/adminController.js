import { query } from '../config/db.js';

export async function getAdminMetrics(req, res, next) {
  try {
    // 1. Total revenue from valid orders
    const revRes = await query(`
      SELECT COALESCE(SUM(total_amount), 0) AS "totalRevenue"
      FROM orders
      WHERE status != 'CANCELLED';
    `);
    const totalRevenue = parseFloat(revRes.rows[0].totalRevenue);

    // 2. Order counts
    const orderCountRes = await query(`
      SELECT 
        COUNT(*) AS "totalOrders",
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS "pendingOrders",
        COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) AS "processingOrders",
        COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END) AS "shippedOrders",
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) AS "deliveredOrders",
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS "cancelledOrders"
      FROM orders;
    `);

    // 3. Product & inventory metrics
    const prodRes = await query(`
      SELECT 
        COUNT(*) AS "totalProducts",
        COUNT(CASE WHEN stock = 0 THEN 1 END) AS "outOfStockCount",
        COUNT(CASE WHEN stock > 0 AND stock <= low_stock_threshold THEN 1 END) AS "lowStockCount"
      FROM products
      WHERE is_active = true;
    `);

    // 4. Customer count
    const customerCountRes = await query(`
      SELECT COUNT(*) AS "totalCustomers"
      FROM users
      WHERE role = 'customer';
    `);

    // 5. Recent 5 orders
    const recentOrdersRes = await query(`
      SELECT 
        o.id, o.order_number AS "orderNumber", o.status, o.total_amount AS "totalAmount",
        o.created_at AS "createdAt", u.company_name AS "companyName"
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5;
    `);

    // 6. Low stock alerts (items needing immediate re-ordering)
    const lowStockAlertsRes = await query(`
      SELECT id, sku, title, category, stock, low_stock_threshold AS "lowStockThreshold"
      FROM products
      WHERE is_active = true AND stock <= low_stock_threshold
      ORDER BY stock ASC
      LIMIT 8;
    `);

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        orderStats: {
          total: parseInt(orderCountRes.rows[0].totalOrders, 10),
          pending: parseInt(orderCountRes.rows[0].pendingOrders, 10),
          processing: parseInt(orderCountRes.rows[0].processingOrders, 10),
          shipped: parseInt(orderCountRes.rows[0].shippedOrders, 10),
          delivered: parseInt(orderCountRes.rows[0].deliveredOrders, 10),
          cancelled: parseInt(orderCountRes.rows[0].cancelledOrders, 10)
        },
        productStats: {
          totalProducts: parseInt(prodRes.rows[0].totalProducts, 10),
          lowStockCount: parseInt(prodRes.rows[0].lowStockCount, 10),
          outOfStockCount: parseInt(prodRes.rows[0].outOfStockCount, 10)
        },
        totalCustomers: parseInt(customerCountRes.rows[0].totalCustomers, 10),
        recentOrders: recentOrdersRes.rows,
        lowStockAlerts: lowStockAlertsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 20, entityType, action } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (entityType && entityType.trim()) {
      params.push(entityType.trim().toUpperCase());
      conditions.push(`a.entity_type = $${params.length}`);
    }

    if (action && action.trim()) {
      params.push(action.trim().toUpperCase());
      conditions.push(`a.action = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM audit_logs a ${whereClause};`, params);
    const totalItems = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    params.push(limitNum);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const logsQuery = `
      SELECT 
        a.id, a.action, a.entity_type AS "entityType", a.entity_id AS "entityId",
        a.details, a.ip_address AS "ipAddress", a.created_at AS "createdAt",
        u.email AS "userEmail", u.company_name AS "companyName", u.role AS "userRole"
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const logsRes = await query(logsQuery, params);

    return res.status(200).json({
      success: true,
      data: logsRes.rows,
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
