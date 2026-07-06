import express from 'express';
import { TaskController } from '../controllers/Task.controller';
import { authenticate } from '../../../middlewares/authMiddleware';

const router = express.Router();

// Task CRUD
router.post('/projects/:projectId/tasks', authenticate, TaskController.create);
router.get('/projects/:projectId/tasks', authenticate, TaskController.getProjectTasks);
router.get('/tasks/:id', authenticate, TaskController.getById);
router.put('/tasks/:id', authenticate, TaskController.update);
router.put('/tasks/:id/status', authenticate, TaskController.updateStatus);
router.delete('/tasks/:id', authenticate, TaskController.delete);

// Task Assignment
router.put('/tasks/:id/assign', authenticate, TaskController.assign);
router.put('/tasks/:id/unassign', authenticate, TaskController.unassign);

// User's tasks
router.get('/users/me/tasks', authenticate, TaskController.getUserTasks);

export default router;