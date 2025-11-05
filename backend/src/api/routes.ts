import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAllCustomers, getCustomer, postCustomer, patchCustomer, deleteCustomer } from './customers.controller.js';
import { getAllProducts, getProduct, postProduct, patchProduct, deleteProduct } from './products.controller.js';
import { getAllOrders, getOrder, postOrder, getAllCustomerOrders } from './orders.controller.js';
import { signIn, login, logout } from './auth.controller.js';
import { getUser, patchUser, patchUserRole, deleteUser, getAllUsers } from './users.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/customers', authenticate, requireAdmin, asyncHandler(getAllCustomers));
router.get('/customers/:id', authenticate, requireAdmin, asyncHandler(getCustomer));
router.post('/customers', authenticate, requireAdmin, asyncHandler(postCustomer));
router.patch('/customers/:id', authenticate, requireAdmin, asyncHandler(patchCustomer));
router.delete('/customers/:id', authenticate, requireAdmin, asyncHandler(deleteCustomer));

router.get('/products', authenticate, asyncHandler(getAllProducts));
router.get('/products/:id', authenticate, asyncHandler(getProduct));
router.post('/products', authenticate, requireAdmin, asyncHandler(postProduct));
router.patch('/products/:id', authenticate, requireAdmin, asyncHandler(patchProduct));
router.delete('/products/:id', authenticate, requireAdmin, asyncHandler(deleteProduct));

router.get('/orders', authenticate, requireAdmin, asyncHandler(getAllOrders));

router.get('/orders/:id', authenticate, asyncHandler(getOrder));
router.post('/orders', authenticate, asyncHandler(postOrder));
router.get('/orders/customers/:id', authenticate, asyncHandler(getAllCustomerOrders));

router.post('/auth/sign-in', asyncHandler(signIn));
router.post('/auth/login', asyncHandler(login));
router.post('/auth/logout', authenticate, asyncHandler(logout));

router.get('/users/me', authenticate, asyncHandler(getUser));
router.patch('/users/me', authenticate, asyncHandler(patchUser));
router.delete('/users/me', authenticate, asyncHandler(deleteUser));

router.get('/users', authenticate, requireAdmin, asyncHandler(getAllUsers));
router.patch('/users/role', authenticate, requireAdmin, asyncHandler(patchUserRole));

export default router;
