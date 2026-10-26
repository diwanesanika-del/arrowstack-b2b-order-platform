import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from '../config/db.js';

export async function runSeeds() {
  console.log('🌱 Seeding database with realistic B2B enterprise demonstration data...');

  await withTransaction(async (client) => {
    // 1. Create Default Users (Admin & Customers)
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const customerPasswordHash = await bcrypt.hash('CustomerPass123!', 10);

    const adminRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `, [
      'admin@b2bdistributors.com',
      adminPasswordHash,
      'Marcus Vance',
      'Apex Industrial Wholesale Distributors LLC',
      'admin',
      '+1-555-0100'
    ]);
    const adminId = adminRes.rows[0].id;

    const customerRes1 = await client.query(`
      INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `, [
      'buyer@acmeindustrial.com',
      customerPasswordHash,
      'Elena Rostova',
      'Acme Industrial Manufacturing Inc.',
      'customer',
      '+1-555-0144'
    ]);
    const customer1Id = customerRes1.rows[0].id;

    const customerRes2 = await client.query(`
      INSERT INTO users (email, password_hash, full_name, company_name, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `, [
      'purchasing@nexuslogistics.com',
      customerPasswordHash,
      'David Kalu',
      'Nexus Global Logistics Corp',
      'customer',
      '+1-555-0188'
    ]);
    const customer2Id = customerRes2.rows[0].id;

    console.log('✓ Users seeded (1 Admin, 2 B2B Customers)');

    // 2. Seed Wholesale Products
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
        stock: 6, // LOW STOCK
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
        stock: 4, // LOW STOCK
        low_stock_threshold: 5,
        image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      },
      {
        sku: 'IND-PNU-302',
        title: 'Braided Reinforced Industrial Polyurethane Air Hose 3/8-in x 100-ft',
        description: 'All-weather extreme flexibility pneumatic hose rated for 300 PSI working pressure with pre-crimped solid brass industrial fittings.',
        category: 'Pneumatics & Hydraulics',
        unit_price: 64.90,
        stock: 0, // OUT OF STOCK to test validation & UI disabled state
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

    const seededProductMap = new Map();

    for (const prod of products) {
      const res = await client.query(`
        INSERT INTO products (sku, title, description, category, unit_price, stock, low_stock_threshold, image_url, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (sku) DO UPDATE SET
          title = EXCLUDED.title,
          unit_price = EXCLUDED.unit_price,
          stock = EXCLUDED.stock,
          image_url = EXCLUDED.image_url
        RETURNING id, sku, unit_price, title;
      `, [
        prod.sku, prod.title, prod.description, prod.category,
        prod.unit_price, prod.stock, prod.low_stock_threshold, prod.image_url
      ]);
      seededProductMap.set(prod.sku, res.rows[0]);
    }
    console.log(`✓ Seeded ${products.length} wholesale catalog products across 5 industrial categories`);

    // 3. Create a realistic historical order for Customer 1
    const p1 = seededProductMap.get('IND-PWR-001');
    const p2 = seededProductMap.get('IND-SAF-201');

    const qty1 = 4;
    const qty2 = 10;
    const line1 = qty1 * parseFloat(p1.unit_price);
    const line2 = qty2 * parseFloat(p2.unit_price);
    const subtotal = line1 + line2;
    const taxRate = 0.08;
    const taxAmount = +(subtotal * taxRate).toFixed(2);
    const totalAmount = +(subtotal + taxAmount).toFixed(2);

    const orderRes = await client.query(`
      INSERT INTO orders (
        order_number, customer_id, status, subtotal, tax_rate, tax_amount, total_amount,
        shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
        contact_phone, po_reference, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW() - INTERVAL '3 days')
      ON CONFLICT (order_number) DO NOTHING
      RETURNING id, order_number;
    `, [
      'ORD-2026-10001',
      customer1Id,
      'SHIPPED',
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      'Elena Rostova - Acme Manufacturing',
      '100 Industrial Parkway, Dock 3',
      'Detroit',
      '48201',
      'United States',
      '+1-555-0144',
      'PO-ACM-9921',
      'Please leave at Receiving Bay #2'
    ]);

    if (orderRes.rows.length > 0) {
      const orderId = orderRes.rows[0].id;

      // Line items
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_title, sku, quantity, unit_price, line_total)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7),
          ($1, $8, $9, $10, $11, $12, $13);
      `, [
        orderId, p1.id, p1.title, p1.sku, qty1, p1.unit_price, line1,
        orderId, p2.id, p2.title, p2.sku, qty2, p2.unit_price, line2
      ]);

      // Commercial Invoice
      await client.query(`
        INSERT INTO invoices (invoice_number, order_id, customer_id, issue_date, due_date, status, subtotal, tax_amount, total_amount)
        VALUES ($1, $2, $3, CURRENT_DATE - 3, CURRENT_DATE + 27, 'ISSUED', $4, $5, $6)
        ON CONFLICT (invoice_number) DO NOTHING;
      `, [
        'INV-2026-10001',
        orderId,
        customer1Id,
        subtotal,
        taxAmount,
        totalAmount
      ]);

      // Audit Log
      await client.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES ($1, 'ORDER_SHIPPED', 'ORDER', $2, $3);
      `, [
        adminId,
        orderId,
        JSON.stringify({ trackingNumber: '1Z9999999999999999', carrier: 'Freight Logistics Direct' })
      ]);

      console.log('✓ Seeded historical order ORD-2026-10001 with invoice INV-2026-10001 and audit trail');
    }

    console.log('🎉 Database seeding complete!');
  });
}

// Allow standalone execution: `node src/db/seed.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Fatal seed error:', err);
      await pool.end();
      process.exit(1);
    });
}
