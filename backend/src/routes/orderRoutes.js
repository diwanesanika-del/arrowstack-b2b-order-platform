import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Placing orders is for customer accounts
router.post('/', requireAuth, requireRole('customer'), createOrder);

// Both customers and admins can list orders (customers are scoped to their own)
router.get('/', requireAuth, getOrders);
router.get('/:id', requireAuth, getOrderById);

// Updating status (admin or customer cancellation)
router.patch('/:id/status', requireAuth, updateOrderStatus);

export default router;
