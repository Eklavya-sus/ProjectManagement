import express from 'express';
import { ProjectController } from '../controllers/Project.controllers';
import { authenticate } from '../../../middlewares/authMiddleware';

const router = express.Router();

// Project CRUD
router.post('/:organizationId/projects', authenticate, ProjectController.create);
router.get('/:organizationId/projects', authenticate, ProjectController.getOrganizationProjects);
router.get('/projects/:id', authenticate, ProjectController.getById);
router.put('/projects/:id', authenticate, ProjectController.update);
router.put('/projects/:id/status', authenticate, ProjectController.updateStatus);
router.delete('/projects/:id', authenticate, ProjectController.delete);

// Project Members
router.post('/projects/:id/members', authenticate, ProjectController.addMember);
router.delete('/projects/:id/members/:memberId', authenticate, ProjectController.removeMember);

export default router;