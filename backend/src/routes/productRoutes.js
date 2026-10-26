import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustInventory
} from '../controllers/productController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Public catalog routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-only management routes
router.post('/', requireAuth, requireRole('admin'), createProduct);
router.put('/:id', requireAuth, requireRole('admin'), updateProduct);
router.patch('/:id/inventory', requireAuth, requireRole('admin'), adjustInventory);

export default router;
