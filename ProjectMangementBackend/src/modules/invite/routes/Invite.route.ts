import express from 'express';
import { InviteController } from '../controllers/Invite.controller';
import { authenticate } from '../../../middlewares/authMiddleware';

const router = express.Router();

// Validate invite link (public)
router.get('/validate/:token', InviteController.validateInvite);

// Send invite (admin only)
router.post('/', authenticate, InviteController.sendInvite);

// Get organization invites (admin only)
router.get('/:orgId', authenticate, InviteController.getInvites);

// Accept invite (public)
router.post('/:token/accept', InviteController.acceptInvite);

// Revoke invite (admin only)
router.delete('/:inviteId', authenticate, InviteController.revokeInvite);

export default router;
