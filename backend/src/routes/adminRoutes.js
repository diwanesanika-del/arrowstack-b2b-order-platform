import { Router } from 'express';
import { getAdminMetrics, getAuditLogs } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireRole('admin'));

router.get('/metrics', getAdminMetrics);
router.get('/audit-logs', getAuditLogs);

export default router;
