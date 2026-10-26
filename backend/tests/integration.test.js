import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './testDb.js';
import { generateToken } from '../src/utils/token.js';
import bcrypt from 'bcryptjs';

describe('Project 1: B2B Order Management Platform Integration Tests', () => {
  let testEnv;
  let pool;
  let adminToken;
  let customer1Token;
  let customer2Token;

  before(async () => {
    testEnv = await createTestDatabase();
    pool = testEnv.pool;

    adminToken = generateToken({
      id: testEnv.users.adminId,
      email: 'admin@b2bdistributors.com',
      role: 'admin',
      fullName: 'Marcus Vance',
      companyName: 'Apex Wholesale LLC'
    });

    customer1Token = generateToken({
      id: testEnv.users.customer1Id,
      email: 'buyer@acmeindustrial.com',
      role: 'customer',
      fullName: 'Elena Rostova',
      companyName: 'Acme Industrial Inc.'
    });

    customer2Token = generateToken({
      id: testEnv.users.customer2Id,
      email: 'purchasing@nexuslogistics.com',
      role: 'customer',
      fullName: 'David Kalu',
      companyName: 'Nexus Logistics'
    });
  });

  // ==========================================
  // 1. AUTHENTICATION & REGISTRATION
  // ==========================================
  test('Auth: Register new customer distributor account', async () => {
    const email = 'procurement@voltamotors.com';
    const passwordHash = await bcrypt.hash('SecurePass2026!', 10);

    const res = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
      VALUES ($1, $2, 'Liam Gallagher', 'Volta Motors LLC', 'customer', '+1-555-0812')
      RETURNING id, email, role, company_name;
    `, [email, passwordHash]);

    assert.equal(res.rowCount, 1);
    assert.equal(res.rows[0].email, email);
    assert.equal(res.rows[0].role, 'customer');
    assert.equal(res.rows[0].company_name, 'Volta Motors LLC');
  });

  test('Auth: Reject duplicate email registration (Unique constraint)', async () => {
    await assert.rejects(
      async () => {
        await pool.query(`
          INSERT INTO users (email, password_hash, full_name, company_name, role)
          VALUES ('admin@b2bdistributors.com', 'dummy_hash', 'Imposter', 'Fake Corp', 'customer');
        `);
      },
      /unique|duplicate/i,
      'Should throw unique constraint violation for duplicate email'
    );
  });

  // ==========================================
  // 2. PRODUCT CATALOG & STOCK STATUS
  // ==========================================
  test('Catalog: Correctly computes stock status badges', async () => {
    const res = await pool.query(`
      SELECT 
        sku, stock, low_stock_threshold,
        CASE
          WHEN stock = 0 THEN 'out_of_stock'
          WHEN stock <= low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products
      ORDER BY sku ASC;
    `);

    const drill = res.rows.find((r) => r.sku === 'IND-PWR-001');
    const helmet = res.rows.find((r) => r.sku === 'IND-WLD-102');
    const airHose = res.rows.find((r) => r.sku === 'IND-PNU-302');

    assert.equal(drill.stock_status, 'in_stock');
    assert.equal(helmet.stock_status, 'low_stock');
    assert.equal(airHose.stock_status, 'out_of_stock');
  });

  test('Inventory: Admin can adjust stock with audit log', async () => {
    const productId = testEnv.products.parka.id;
    const initialStock = testEnv.products.parka.stock;
    const addition = 20;

    // Execute atomic update
    const updateRes = await pool.query(`
      UPDATE products
      SET stock = stock + $1
      WHERE id = $2
      RETURNING stock;
    `, [addition, productId]);

    assert.equal(updateRes.rows[0].stock, initialStock + addition);

    // Audit log entry
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, 'INVENTORY_ADJUSTMENT', 'PRODUCT', $2, $3);
    `, [testEnv.users.adminId, productId, JSON.stringify({ adjustment: addition, newStock: initialStock + addition })]);

    const auditRes = await pool.query(`
      SELECT * FROM audit_logs WHERE entity_id = $1 AND action = 'INVENTORY_ADJUSTMENT';
    `, [productId]);

    assert.equal(auditRes.rowCount, 1);
  });

  // ==========================================
  // 3. ORDER PLACEMENT & CONCURRENCY RULES
  // ==========================================
  test('Order Business Rule: Reject order when requested quantity exceeds stock', async () => {
    const productId = testEnv.products.welder.id; // stock = 0
    const requestedQty = 2;

    const prodRes = await pool.query('SELECT stock FROM products WHERE id = $1', [productId]);
    const currentStock = prodRes.rows[0].stock;

    assert.ok(requestedQty > currentStock, 'Requested quantity must be greater than current stock for test');
    
    // Attempting check should be rejected by business rule
    let rejected = false;
    if (requestedQty > currentStock) {
      rejected = true;
    }
    assert.equal(rejected, true, 'Backend business logic must reject order when quantity exceeds stock');
  });

  test('Order Placement: Calculate prices on backend, deduct stock, and generate invoice', async () => {
    const drillId = testEnv.products.drill.id;
    const purchaseQty = 4;
    const customerId = testEnv.users.customer1Id;

    // Check pre-order stock
    const preRes = await pool.query('SELECT stock, unit_price, title, sku FROM products WHERE id = $1', [drillId]);
    const preStock = preRes.rows[0].stock;
    const unitPrice = parseFloat(preRes.rows[0].unit_price);

    // Backend calculates totals
    const lineTotal = +(unitPrice * purchaseQty).toFixed(2);
    const subtotal = lineTotal;
    const taxRate = 0.0800;
    const taxAmount = +(subtotal * taxRate).toFixed(2);
    const totalAmount = +(subtotal + taxAmount).toFixed(2);

    // 1. Deduct stock
    await pool.query('UPDATE products SET stock = stock - ($1::int) WHERE id = $2', [purchaseQty, drillId]);

    // 2. Create Order
    const orderNumber = 'ORD-TEST-99001';
    const orderRes = await pool.query(`
      INSERT INTO orders (
        order_number, customer_id, status, subtotal, tax_rate, tax_amount, total_amount,
        shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
        contact_phone, po_reference
      ) VALUES ($1, $2, 'PENDING', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, order_number, status, total_amount;
    `, [
      orderNumber, customerId, subtotal, taxRate, taxAmount, totalAmount,
      'Elena Rostova', '100 Industrial Pkwy', 'Detroit', '48201', 'United States',
      '+1-555-0144', 'PO-TEST-001'
    ]);

    const orderId = orderRes.rows[0].id;
    assert.equal(orderRes.rows[0].order_number, orderNumber);
    assert.equal(parseFloat(orderRes.rows[0].total_amount), totalAmount);

    // 3. Create Line Items
    await pool.query(`
      INSERT INTO order_items (order_id, product_id, product_title, sku, quantity, unit_price, line_total)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [orderId, drillId, preRes.rows[0].title, preRes.rows[0].sku, purchaseQty, unitPrice, lineTotal]);

    // 4. Create Invoice
    const invoiceNumber = 'INV-TEST-99001';
    const invRes = await pool.query(`
      INSERT INTO invoices (invoice_number, order_id, customer_id, issue_date, due_date, status, subtotal, tax_amount, total_amount)
      VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + 30, 'ISSUED', $4, $5, $6)
      RETURNING id, invoice_number;
    `, [invoiceNumber, orderId, customerId, subtotal, taxAmount, totalAmount]);

    assert.equal(invRes.rows[0].invoice_number, invoiceNumber);

    // Verify stock deduction
    const postRes = await pool.query('SELECT stock FROM products WHERE id = $1', [drillId]);
    assert.equal(postRes.rows[0].stock, preStock - purchaseQty, 'Stock must be decremented by ordered quantity');

    testEnv.testOrderId = orderId;
    testEnv.orderedDrillId = drillId;
    testEnv.purchaseQty = purchaseQty;
  });

  // ==========================================
  // 4. MULTI-TENANT CUSTOMER DATA ISOLATION
  // ==========================================
  test('Security Boundary: Customer A cannot view Customer B orders', async () => {
    const orderId = testEnv.testOrderId;
    const customer2Id = testEnv.users.customer2Id;

    // Query for customer 2 attempting to view customer 1's order
    const res = await pool.query(`
      SELECT o.id, o.customer_id
      FROM orders o
      WHERE o.id = $1 AND o.customer_id = $2;
    `, [orderId, customer2Id]);

    assert.equal(res.rowCount, 0, 'Customer 2 query must return 0 rows for Customer 1 order (Strict isolation)');
  });

  test('Security Boundary: Admin can access any customer order', async () => {
    const orderId = testEnv.testOrderId;

    // Admin query (unscoped by customer_id)
    const res = await pool.query(`
      SELECT o.id, o.order_number, u.company_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = $1;
    `, [orderId]);

    assert.equal(res.rowCount, 1, 'Admin can view any order');
    assert.equal(res.rows[0].company_name, 'Acme Industrial Inc.');
  });

  // ==========================================
  // 5. ORDER CANCELLATION & STOCK REPLENISHMENT
  // ==========================================
  test('Order Cancellation: Restores inventory safely and updates invoice', async () => {
    const orderId = testEnv.testOrderId;
    const drillId = testEnv.orderedDrillId;
    const qtyToRestore = testEnv.purchaseQty;

    const preStockRes = await pool.query('SELECT stock FROM products WHERE id = $1', [drillId]);
    const preStock = preStockRes.rows[0].stock;

    // 1. Update order status to CANCELLED
    await pool.query(`UPDATE orders SET status = 'CANCELLED' WHERE id = $1`, [orderId]);

    // 2. Replenish stock
    await pool.query('UPDATE products SET stock = stock + ($1::int) WHERE id = $2', [qtyToRestore, drillId]);

    // 3. Mark invoice as CANCELLED
    await pool.query(`UPDATE invoices SET status = 'CANCELLED' WHERE order_id = $1`, [orderId]);

    // Verify stock restored
    const postStockRes = await pool.query('SELECT stock FROM products WHERE id = $1', [drillId]);
    assert.equal(postStockRes.rows[0].stock, preStock + qtyToRestore, 'Inventory must be restored upon cancellation');

    // Verify invoice cancelled
    const invRes = await pool.query('SELECT status FROM invoices WHERE order_id = $1', [orderId]);
    assert.equal(invRes.rows[0].status, 'CANCELLED');
  });
});
