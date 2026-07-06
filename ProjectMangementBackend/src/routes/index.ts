import express from 'express';
import userRoutes from '../modules/users/routes/User.route';
import organizationRoutes from '../modules/organization/routes/Organization.route';
import projectRoutes from '../modules/project/routes/Project.route';
import taskRoutes from '../modules/task/routes/Task.route';
import auditLogsRoutes from '../modules/AuditLog/routes/AuditLogs.route';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/org', organizationRoutes);
router.use('/', projectRoutes);
router.use('/', taskRoutes);
router.use('/', auditLogsRoutes);

export default router;