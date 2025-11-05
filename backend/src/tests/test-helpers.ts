import app from '../app.js';
import request from 'supertest';
import { initDb, truncateAll, db } from '../infra/database.js';
import { seedTestData, clearTestData } from './test-seed.js';
import { closeRedis } from '../events/redis.js';
import { findUserById, UserRole } from '../core/users.repo.js';
import { generateToken } from '../core/auth.service.js';

export const api = request(app);

export async function bootTestDb() {
  await initDb();
  await truncateAll();
  await seedTestData();
}

export async function resetTestData() {
  await clearTestData();
}

export async function closeDb() {
  await db.end();
  await closeRedis();
}

export async function loginAs(role: UserRole): Promise<string> {
  const user_id = role === UserRole.ADMIN ? 1 : 2;
  const user = await findUserById(user_id);
  if (!user) {
    throw new Error(`User with id "${user_id}" not found in test database`);
  }

  const token = generateToken(user);

  return `token=${token}`;
}
