import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogs.controller';
import { authenticate } from '../../../middlewares/authMiddleware';

const router = Router();

// Organization audit logs (main endpoint)
router.get('/:organizationId/audit-logs', authenticate, AuditLogController.getOrganizationLogs);

// Filtered audit logs (advanced filtering)
router.get('/:organizationId/audit-logs/filtered', authenticate, AuditLogController.getFilteredLogs);

// Project-specific logs
router.get('/:organizationId/projects/:projectId/audit-logs', authenticate, AuditLogController.getProjectLogs);

// Task-specific logs  
router.get('/:organizationId/tasks/:taskId/audit-logs', authenticate, AuditLogController.getTaskLogs);

// Get combined project and task activity
router.get('/:organizationId/projects/:projectId/activity', authenticate, AuditLogController.getProjectActivity);
export default router;