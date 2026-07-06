import express from 'express';
import { OrganizationController } from '../controllers/Organization.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { validateRequest } from '../../../middlewares/validateRequest';
import { createOrgSchema } from '../validators/createOrgSchema';
import { getOrgUsersSchema } from '../validators/getOrgUsersScehma';
import InviteRoutes from '../../invite/routes/Invite.route'

const router = express.Router();

router.post('/create', 
  authenticate, 
  validateRequest(createOrgSchema), 
  OrganizationController.create
);
router.get('/:id', 
  authenticate, 
  OrganizationController.getById
);
router.get(
  "/:id/users",
  authenticate,
  validateRequest(getOrgUsersSchema),
  OrganizationController.getUsers
);
router.use('/invite', InviteRoutes);

export default router;