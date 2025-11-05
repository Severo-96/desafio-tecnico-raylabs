import { db } from '../infra/database.js';
import { HttpError } from '../errors/HttpError.js';
import { withTransaction, type TxClient } from '../infra/transaction.js';
import { createCustomer, updateCustomer } from './customers.repo.js';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
}

export type User = {
  id: string;
  email: string;
  nickname: string;
  password_hash: string;
  role: UserRole;
  customer_id: string;
  created_at: string;
  updated_at: string;
};

export type UserAndCustomerInfo = {
  nickname: string;
  role: UserRole;
  customer_id: string;
  name: string;
  email: string;
  document_number: string;
};

export type UserWithoutPassword = Omit<User, 'password_hash'>;

export async function createUser(params: {
  email: string;
  nickname: string;
  password: string;
  name: string;
  document_number: string;
}) {
  const nicknameNormalized = params.nickname.trim();

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(params.password, saltRounds);

  try {
    return await withTransaction(async (tx: TxClient) => {
      const customer = await createCustomer(
        {
          name: params.name,
          email: params.email,
          document_number: params.document_number
        },
        tx
      );

      if (!customer) { throw new HttpError('Failed to create user', 500); }

      const userResult = await tx.query<User>(
        `INSERT INTO users (nickname, password_hash, customer_id)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [
          nicknameNormalized,
          password_hash,
          customer.id
        ]
      );

      if (!userResult.rows[0]) { throw new HttpError('Failed to create user', 500); }

      return userResult.rows[0];
    });
  } catch (err: any) {
    if (err.constraint === 'uniq_users_nickname') {
      throw new HttpError('Nickname already registered', 409);
    }
    throw err;
  }
}

export async function findUserByNickname(nickname: string) {
  const nicknameNormalized = nickname.trim();

  const { rows } = await db.query<User>(
    `SELECT * FROM users WHERE nickname = $1`,
    [nicknameNormalized]
  );

  return rows[0];
}

export async function findUserById(id: string | number ) {
  const { rows } = await db.query<User>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );

  return rows[0];
}

export async function findUserAndCustomerById(id: string | number ) {
  const { rows } = await db.query<UserAndCustomerInfo>(
    `SELECT users.nickname, users.role, users.customer_id, customers.name, customers.email, customers.document_number 
    FROM users 
    INNER JOIN customers ON users.customer_id = customers.id WHERE users.id = $1`,
    [id]
  );

  return rows[0];
}

export async function validateUserLogin(nickname: string, password: string) {
  const user = await findUserByNickname(nickname);

  console.log('user', user);

  if (!user) {
    throw new HttpError('Invalid nickname or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new HttpError('Invalid nickname or password', 401);
  }
  
  return user;
}

export async function updateUser(params: {
  email: string;
  id: string | number ;
  password?: string;
  name: string;
  document_number: string;
}) {
  const user = await findUserById(params.id);
  if (!user) {
    throw new HttpError('User not found', 404);
  }

  let password_hash: string | undefined;
  if (params.password) {
    const saltRounds = 10;
    password_hash = await bcrypt.hash(params.password, saltRounds);
  }

  try {
    return await withTransaction(async (tx: TxClient) => {
      await updateCustomer(
        {
          id: user.customer_id,
          name: params.name,
          email: params.email,
          document_number: params.document_number
        },
        tx
      );

      if (!params.password) { return user; } 

      const { rows } = await tx.query<User>(
        `UPDATE users
        SET password_hash = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *`, 
        [password_hash, user.id]
      );
        
      if (!rows[0]) {
        throw new HttpError('Failed to update user', 500);
      }
      
      return rows[0];
    });
  } catch (err: any) {
    throw err;
  }
}

export async function updateUserRoleByCustomerId(customer_id: string | number, role: UserRole) {
  const { rows } = await db.query<User>(
    `UPDATE users
    SET role = $1,
        updated_at = NOW()
    WHERE customer_id = $2
    RETURNING id, nickname, role, customer_id`,
    [role, customer_id]
  );
  
  if (!rows[0]) {
    throw new HttpError('User not found for this customer', 404);
  }
  
  return rows[0];
}

export async function deleteUserById(id: string | number) {
  const result = await db.query(`DELETE FROM users WHERE id = $1 RETURNING *;`, [id]);

  if (result.rowCount === 0) {
    throw new HttpError('User not found', 404);
  }
}

export type UserWithCustomerInfo = {
  id: string;
  nickname: string;
  role: UserRole;
  customer_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  document_number: string;
};

export async function listUsers(limit = 50, offset = 0) {
  const [result, countResult] = await Promise.all([
    db.query<UserWithCustomerInfo>(
      `SELECT 
        users.id,
        users.nickname,
        users.role,
        users.customer_id,
        users.created_at,
        users.updated_at,
        customers.name,
        customers.email,
        customers.document_number
      FROM users
      INNER JOIN customers ON users.customer_id = customers.id
      ORDER BY users.id ASC 
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    db.query<{ count: string }>(`SELECT COALESCE(COUNT(*), 0)::int as count FROM users`)
  ]);
  
  return {
    data: result.rows,
    total: Number(countResult.rows[0]?.count || 0)
  };
}
