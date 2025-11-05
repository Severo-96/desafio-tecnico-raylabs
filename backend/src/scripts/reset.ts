import dotenv from 'dotenv';
import { db } from '../infra/database.js';
import { seed } from '../infra/seed.js';

dotenv.config();

async function main() {
  console.log('Resetting database...');

  try {
    await db.query(`
      TRUNCATE TABLE 
        order_items, 
        orders, 
        products, 
        customers 
      RESTART IDENTITY CASCADE;
    `);

    console.log('Database reset completed, re-seeding database...');
    await seed();
    console.log('Database reset and seed completed successfully!');

  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
