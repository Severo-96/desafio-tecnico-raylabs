import { db } from './database.js';
import * as bcrypt from 'bcrypt';

export async function seed() {
  console.log('Seeding database...');

  try {
    // Insert customers without explicit IDs (let PostgreSQL generate them)
    const customerResult = await db.query(`
      INSERT INTO customers (name, email, document_number)
      VALUES
        ('Person One', 'personone@example.com', '39053344705'),
        ('Person Two', 'persontwo@example.com', '12345678901'),
        ('Company One', 'companyone@example.com', '12345678000190'),
        ('Person Three', 'personthree@example.com', '98765432100'),
        ('Admin User', 'admin@example.com', '00000000000')
      ON CONFLICT (document_number) DO NOTHING
      RETURNING id, email;
    `);

    console.log(`Seeded ${customerResult.rowCount || 0} customers`);

    const passwordHash = await bcrypt.hash('password123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    // Insert users using customer document numbers to find their IDs
    const usersResult = await db.query(`
      INSERT INTO users (nickname, password_hash, role, customer_id)
      VALUES
        ('personone', $1, 'client', (SELECT id FROM customers WHERE document_number = '39053344705' LIMIT 1)),
        ('persontwo', $1, 'client', (SELECT id FROM customers WHERE document_number = '12345678901' LIMIT 1)),
        ('companyone', $1, 'client', (SELECT id FROM customers WHERE document_number = '12345678000190' LIMIT 1)),
        ('personthree', $1, 'client', (SELECT id FROM customers WHERE document_number = '98765432100' LIMIT 1)),
        ('admin', $2, 'admin', (SELECT id FROM customers WHERE document_number = '00000000000' LIMIT 1))
      ON CONFLICT (nickname) DO NOTHING
      RETURNING id;
    `, [passwordHash, adminPasswordHash]);

    const productResult = await db.query(`
      INSERT INTO products (name, amount, stock)
      VALUES
        ('Product One', 100.00, 10),
        ('Product Two', 89.90, 50),
        ('Product Three', 299.90, 30),
        ('Product Four', 1299.00, 15),
        ('Product Five', 249.90, 25),
        ('Product Six', 459.90, 20),
        ('Product Seven', 599.90, 40),
        ('Product Eight', 399.90, 35)
      ON CONFLICT (name) DO NOTHING
      RETURNING id;
    `);

    console.log(`Seeded ${productResult.rowCount || 0} products`);

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

export async function clearSeed() {
  console.log('Clearing seed data...');

  try {
    await db.query(`TRUNCATE TABLE order_items, orders, products, users, customers RESTART IDENTITY CASCADE;`);
    console.log('Seed data cleared successfully!');
  } catch (error) {
    console.error('Clear seed failed:', error);
    throw error;
  }
}

