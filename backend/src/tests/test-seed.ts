import { db } from '../infra/database.js';
import * as bcrypt from 'bcrypt';

export async function seedTestData() {
  await db.query(`
    INSERT INTO customers (id, name, email, document_number, created_at, updated_at)
    VALUES
      ('1', 'Test Customer', 'test@example.com', '39053344705', NOW(), NOW()),
      ('2', 'Customer Two', 'customer2@example.com', '12345678901', NOW(), NOW()),
      ('3', 'Customer Three', 'customer3@example.com', '98765432100', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      document_number = EXCLUDED.document_number;
  `);

  await db.query(`
    SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
  `);

  const passwordHash = await bcrypt.hash('password123', 10);

  await db.query(`
    INSERT INTO users (nickname, password_hash, role, customer_id)
    VALUES
      ('testcustomer', $1, 'admin', 1),
      ('customertwo', $1, 'client', 2),
      ('customerthree', $1, 'client', 3)
    ON CONFLICT (nickname) DO NOTHING;
  `, [passwordHash]);

  await db.query(`
    INSERT INTO products (id, name, amount, stock, created_at, updated_at)
    VALUES
      ('10', 'Product One', 100.00, 10, NOW(), NOW()),
      ('11', 'Product Two', 50.00, 5, NOW(), NOW()),
      ('12', 'Product Three', 200.00, 20, NOW(), NOW()),
      ('13', 'Product Four', 150.00, 15, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      amount = EXCLUDED.amount,
      stock = EXCLUDED.stock;
  `);

  await db.query(`
    SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
  `);

  await db.query(`
    INSERT INTO orders (id, customer_id, status, amount, created_at, updated_at)
    VALUES
      ('100', '1', 'PENDING_PAYMENT', 100.00, NOW(), NOW()),
      ('101', '1', 'CONFIRMED', 250.00, NOW(), NOW()),
      ('102', '2', 'PENDING_PAYMENT', 50.00, NOW(), NOW()),
      ('103', '2', 'CANCELLED', 200.00, NOW(), NOW()),
      ('104', '1', 'PAYMENT_FAILED', 150.00, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      customer_id = EXCLUDED.customer_id,
      status = EXCLUDED.status,
      amount = EXCLUDED.amount;
  `);

  await db.query(`
    SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
  `);

  await db.query(`
    INSERT INTO order_items (id, order_id, product_id, quantity, amount, created_at, updated_at)
    VALUES
      -- Order 100 (PENDING_PAYMENT): 1x Product 10
      ('1000', '100', '10', 1, 100.00, NOW(), NOW()),
      
      -- Order 101 (CONFIRMED): 2x Product 10 + 1x Product 11 = 250.00
      ('1001', '101', '10', 2, 200.00, NOW(), NOW()),
      ('1002', '101', '11', 1, 50.00, NOW(), NOW()),
      
      -- Order 102 (PENDING_PAYMENT): 1x Product 11
      ('1003', '102', '11', 1, 50.00, NOW(), NOW()),
      
      -- Order 103 (CANCELLED): 1x Product 12
      ('1004', '103', '12', 1, 200.00, NOW(), NOW()),
      
      -- Order 104 (PAYMENT_FAILED): 1x Product 13
      ('1005', '104', '13', 1, 150.00, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      order_id = EXCLUDED.order_id,
      product_id = EXCLUDED.product_id,
      quantity = EXCLUDED.quantity,
      amount = EXCLUDED.amount;
  `);

  await db.query(`
    SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items));
  `);
}


export async function clearTestData() {
  // Clear only orders and order_items created by tests
  // Keep basic seed data (orders 100-104 and their items)
  await db.query(`
    DELETE FROM order_items WHERE order_id NOT IN ('100', '101', '102', '103', '104');
    DELETE FROM orders WHERE id NOT IN ('100', '101', '102', '103', '104');
  `);
  
  // Reset products stock to original seed values
  await db.query(`
    UPDATE products SET 
      stock = CASE
        WHEN id = '10' THEN 10
        WHEN id = '11' THEN 5
        WHEN id = '12' THEN 20
        WHEN id = '13' THEN 15
        ELSE stock
      END,
      amount = CASE
        WHEN id = '10' THEN 100.00
        WHEN id = '11' THEN 50.00
        WHEN id = '12' THEN 200.00
        WHEN id = '13' THEN 150.00
        ELSE amount
      END
  `);
  
  // Reset seed orders to original states
  await db.query(`
    UPDATE orders SET 
      status = CASE
        WHEN id = '100' THEN 'PENDING_PAYMENT'
        WHEN id = '101' THEN 'CONFIRMED'
        WHEN id = '102' THEN 'PENDING_PAYMENT'
        WHEN id = '103' THEN 'CANCELLED'
        WHEN id = '104' THEN 'PAYMENT_FAILED'
        ELSE status
      END,
      amount = CASE
        WHEN id = '100' THEN 100.00
        WHEN id = '101' THEN 250.00
        WHEN id = '102' THEN 50.00
        WHEN id = '103' THEN 200.00
        WHEN id = '104' THEN 150.00
        ELSE amount
      END
  `);
}

