import { Router } from 'express';
import { getInvoices, getInvoiceById } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getInvoices);
router.get('/:id', requireAuth, getInvoiceById);

export default router;
