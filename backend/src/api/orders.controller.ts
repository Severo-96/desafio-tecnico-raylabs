import type { Request, Response } from "express";
import type { TxClient } from '../infra/transaction.js';
import { isNonNegativeInt } from '../core/validators.js';
import { listOrders, findOrder, createOrder, updateOrderAmount, listCustomerOrders } from '../core/orders.repo.js';
import { findOrderItemsByOrderId, createOrderItem } from '../core/ordersItems.repo.js';
import { findCustomer } from '../core/customers.repo.js';
import { withTransaction } from '../infra/transaction.js';
import { publishToOutbox } from '../events/producer.js';
import { HttpError } from '../errors/HttpError.js';
import { UserRole } from '../core/users.repo.js';

export async function getAllOrders(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const result = await listOrders(limit, offset);
  return res.json({ 
    data: result.data, 
    pagination: { limit, offset, total: result.total } 
  });
}

export async function getOrder(req: Request<{ id: string }>, res: Response) {
  const userPayload = req.user;
  
  if (!userPayload) {
    throw new HttpError('User not authenticated', 401);
  }

  const order = await findOrder(req.params.id);
  if (!order || (userPayload.role !== UserRole.ADMIN && order.customer_id !== userPayload.customer_id)) {
    throw new HttpError('Order not found', 404);
  }

  const items = await findOrderItemsByOrderId(order.id);
  return res.json({ ...order, items });
}

export async function postOrder(req: Request, res: Response) {
  const userPayload = req.user;
  
  if (!userPayload) {
    throw new HttpError('User not authenticated', 401);
  }

  let { customer_id } = req.body || {};
  const { items } = req.body || {};

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    throw new HttpError("Invalid Parameters", 400);
  }

  if (userPayload.role !== UserRole.ADMIN) {
    customer_id = userPayload.customer_id;
  }

  const customer = await findCustomer(customer_id);
  if (!customer) { throw new HttpError('Customer not found', 404); }

  const result = await withTransaction(async function (tx: TxClient) {
    // Verify products and stock within transaction with lock
    const productIdsArray = items.map((item) => item.product_id);
    
    // Lock products to avoid race condition
    const { rows: products } = await tx.query(
      `SELECT * FROM products WHERE id = ANY($1::bigint[]) FOR UPDATE`,
      [productIdsArray]
    );

    const productMap = new Map(products.map((p: any) => [String(p.id), p]));

    const order = await createOrder(tx, customer_id);

    const createdItems: Array<{
      id: string;
      product_id: string;
      quantity: number;
      amount: number;
      product_name: string;
      product_amount: number;
    }> = [];
    let totalOrderAmount = 0;

    for (const item of items) {
      const quantity = Number(item.quantity ?? 0);
      if (!isNonNegativeInt(quantity) || quantity === 0) {
        throw new HttpError('Invalid quantity', 400);
      }

      const product = productMap.get(String(item.product_id));
      if (!product) { throw new HttpError('Product not found', 404); }
      if (product.stock < quantity) { throw new HttpError(`Product "${product.id}" out of stock`, 400); }

      const orderItemAmount = product.amount * quantity;
      totalOrderAmount += orderItemAmount;

      const orderItem = await createOrderItem(tx, {
        order_id: order.id,
        product_id: product.id,
        quantity,
        amount: orderItemAmount,
      });

      createdItems.push({
        id: orderItem.id,
        product_id: orderItem.product_id,
        quantity: orderItem.quantity,
        amount: orderItem.amount,
        product_name: product.name,
        product_amount: product.amount,
      });
    }

    const updatedOrder = await updateOrderAmount(tx, order.id, totalOrderAmount);
    await publishToOutbox(tx, "order.created", {
      type: "ORDER_CREATED",
      data: {
        order_id: updatedOrder.id
      },
    });

    return { order: updatedOrder, items: createdItems };
  });

  return res.status(201).json({
    id: result.order.id,
    customer_id: result.order.customer_id,
    status: result.order.status,
    amount: result.order.amount,
    items: result.items,
  });
}

export async function getAllCustomerOrders(req: Request, res: Response) {
  const customer_id = String(req.params.id);
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const customer = await findCustomer(customer_id);
  if (!customer) {
    throw new HttpError('Customer not found', 404);
  }
  
  const result = await listCustomerOrders(customer_id, limit, offset);
  return res.json({ 
    data: result.data, 
    pagination: { limit, offset, total: result.total } 
  });
}
