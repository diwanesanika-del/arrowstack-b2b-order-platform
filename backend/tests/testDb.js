import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createTestDatabase() {
  const db = newDb({
    autoCreateForeignKeyIndices: true
  });

  // Register PostgreSQL gen_random_uuid() function in pg-mem
  db.public.registerFunction({
    name: 'gen_random_uuid',
    args: [],
    returns: db.public.getType('uuid'),
    impure: true,
    implementation: () => crypto.randomUUID()
  });

  // Register interval math helpers
  db.public.registerFunction({
    name: 'now',
    args: [],
    returns: db.public.getType('timestamp with time zone'),
    impure: true,
    implementation: () => new Date()
  });

  // Create pg pool adapter
  const { Pool } = db.adapters.createPg();
  const testPool = new Pool();

  // Read schema migration
  const migrationPath = path.join(__dirname, '../src/db/migrations/001_initial_schema.sql');
  let schemaSql = fs.readFileSync(migrationPath, 'utf8');

  // Strip CREATE EXTENSION which is internal to pg-mem
  schemaSql = schemaSql.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/gi, '');

  // Apply schema
  await testPool.query(schemaSql);

  // Seed default admin and customers
  const adminHash = await bcrypt.hash('AdminPass123!', 10);
  const custHash = await bcrypt.hash('CustomerPass123!', 10);

  const adminRes = await testPool.query(`
    INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
    VALUES ('admin@b2bdistributors.com', '${adminHash}', 'Marcus Vance', 'Apex Wholesale LLC', 'admin', '+1-555-0100')
    RETURNING id;
  `);

  const cust1Res = await testPool.query(`
    INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
    VALUES ('buyer@acmeindustrial.com', '${custHash}', 'Elena Rostova', 'Acme Industrial Inc.', 'customer', '+1-555-0144')
    RETURNING id;
  `);

  const cust2Res = await testPool.query(`
    INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
    VALUES ('purchasing@nexuslogistics.com', '${custHash}', 'David Kalu', 'Nexus Logistics', 'customer', '+1-555-0188')
    RETURNING id;
  `);

  // Seed full realistic wholesale catalog across industrial categories
  const products = [
    {
      sku: 'IND-PWR-001',
      title: 'Industrial High-Torque 20V Cordless Hammer Drill Kit',
      description: 'Brushless heavy-duty hammer drill delivering 1,200 in-lbs of torque. Includes two 5.0Ah lithium battery packs and rapid charger.',
      category: 'Power Tools',
      unit_price: 249.50,
      stock: 45,
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-PWR-002',
      title: 'Variable-Speed 7-Inch Heavy-Duty Angle Grinder 15A',
      description: 'High-amperage industrial grinder equipped with advanced overload protection, electronic brake, and tool-free guard adjustment.',
      category: 'Power Tools',
      unit_price: 189.99,
      stock: 32,
      low_stock_threshold: 8,
      image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-WLD-101',
      title: 'ProArc Multi-Process MIG/TIG/Stick Welder 220V',
      description: 'Commercial digital welding system with synergic pulse technology, dual-voltage input, and high duty cycle for continuous fabrication.',
      category: 'Welding Equipment',
      unit_price: 899.00,
      stock: 12,
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-WLD-102',
      title: 'Auto-Darkening TrueColor Optical Welding Helmet Class 1/1/1/1',
      description: 'Premium clarity safety helmet with 4 arc sensors, panoramic view screen, and solar-assist lithium rechargeable cells.',
      category: 'Welding Equipment',
      unit_price: 145.00,
      stock: 6, // Low stock
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-SAF-201',
      title: 'ANSI Class 3 High-Visibility Waterproof All-Weather Parka',
      description: 'Fluorescent safety jacket with 3M Scotchlite reflective stripes, thermal fleece liner, and tear-resistant Oxford polyester shell.',
      category: 'Safety & PPE',
      unit_price: 78.50,
      stock: 85,
      low_stock_threshold: 15,
      image_url: 'https://images.unsplash.com/photo-1578873375972-00b8efeb7719?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-SAF-202',
      title: 'Bulk Pack ANSI Z87.1 Anti-Fog Scratch-Resistant Safety Eyewear (Box of 50)',
      description: 'Wholesale distributor pack of clear ballistic poly-carbonate protective eyewear for plant workers and manufacturing visitors.',
      category: 'Safety & PPE',
      unit_price: 115.00,
      stock: 40,
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-PNU-301',
      title: 'Cast Iron Two-Stage Industrial Air Compressor 80-Gallon 5HP',
      description: 'Continuous run 175 PSI stationary compressor delivering 18.5 CFM at 90 PSI. Suitable for multi-bay automotive and pneumatic lines.',
      category: 'Pneumatics & Hydraulics',
      unit_price: 1750.00,
      stock: 4, // Low stock
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-PNU-302',
      title: 'Braided Reinforced Industrial Polyurethane Air Hose 3/8-in x 100-ft',
      description: 'All-weather extreme flexibility pneumatic hose rated for 300 PSI working pressure with pre-crimped solid brass industrial fittings.',
      category: 'Pneumatics & Hydraulics',
      unit_price: 64.90,
      stock: 0, // Out of stock
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    },
    {
      sku: 'IND-FST-401',
      title: 'Grade 8 Heavy Hex Structural Bolt & Nut Assortment (Case of 1,200 pcs)',
      description: 'Yellow zinc dichromate high-tensile alloy steel fasteners for structural steel framing and machine assembly.',
      category: 'Fasteners & Hardware',
      unit_price: 320.00,
      stock: 28,
      low_stock_threshold: 8,
      image_url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const productMap = {};
  for (const prod of products) {
    const res = await testPool.query(`
      INSERT INTO products (sku, title, description, category, unit_price, stock, low_stock_threshold, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, sku, unit_price, stock, title, category;
    `, [
      prod.sku, prod.title, prod.description, prod.category,
      prod.unit_price, prod.stock, prod.low_stock_threshold, prod.image_url
    ]);
    productMap[prod.sku] = res.rows[0];
  }

  // Seed sample order and invoice
  const pDrill = productMap['IND-PWR-001'];
  const pParka = productMap['IND-SAF-201'];
  const ordQty1 = 2;
  const ordQty2 = 4;
  const subtotal = +(ordQty1 * parseFloat(pDrill.unit_price) + ordQty2 * parseFloat(pParka.unit_price)).toFixed(2);
  const taxAmount = +(subtotal * 0.08).toFixed(2);
  const totalAmount = +(subtotal + taxAmount).toFixed(2);

  const ordRes = await testPool.query(`
    INSERT INTO orders (
      order_number, customer_id, status, subtotal, tax_rate, tax_amount, total_amount,
      shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
      contact_phone, po_reference, notes
    ) VALUES (
      'ORD-2026-10001', '${cust1Res.rows[0].id}', 'SHIPPED', ${subtotal}, 0.08, ${taxAmount}, ${totalAmount},
      'Elena Rostova', '100 Industrial Pkwy', 'Detroit', '48201', 'United States',
      '+1-555-0144', 'PO-ACM-9921', 'Receiving Bay #2'
    ) RETURNING id;
  `);
  const sampleOrderId = ordRes.rows[0].id;

  await testPool.query(`
    INSERT INTO order_items (order_id, product_id, product_title, sku, quantity, unit_price, line_total)
    VALUES
      ('${sampleOrderId}', '${pDrill.id}', '${pDrill.title}', '${pDrill.sku}', ${ordQty1}, ${pDrill.unit_price}, ${ordQty1 * parseFloat(pDrill.unit_price)}),
      ('${sampleOrderId}', '${pParka.id}', '${pParka.title}', '${pParka.sku}', ${ordQty2}, ${pParka.unit_price}, ${ordQty2 * parseFloat(pParka.unit_price)});
  `);

  await testPool.query(`
    INSERT INTO invoices (invoice_number, order_id, customer_id, issue_date, due_date, status, subtotal, tax_amount, total_amount)
    VALUES ('INV-2026-10001', '${sampleOrderId}', '${cust1Res.rows[0].id}', CURRENT_DATE, CURRENT_DATE + 30, 'ISSUED', ${subtotal}, ${taxAmount}, ${totalAmount});
  `);

  return {
    pool: testPool,
    users: {
      adminId: adminRes.rows[0].id,
      customer1Id: cust1Res.rows[0].id,
      customer2Id: cust2Res.rows[0].id
    },
    products: {
      drill: pDrill,
      parka: pParka,
      welder: productMap['IND-PNU-302'] // out of stock reference
    }
  };
}
