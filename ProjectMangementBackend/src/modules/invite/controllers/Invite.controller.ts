// src/controllers/Invite.controller.ts
import { Request, Response, NextFunction } from 'express';
import { InviteService } from '../services/Invite.service';
import { AuthenticateRequest } from '../../../middlewares/authMiddleware';
import createError from 'http-errors';
import { acceptInviteSchema, sendInviteSchema } from '../validators/invite.validations';

export class InviteController {
  /**
   * Admin sends an invite to a new user
   * POST /api/org/invite
   */
  static async sendInvite(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { error, value } = sendInviteSchema.validate(req.body);
      if (error) {
        throw createError(400, error.details[0].message);
      }

      if (!req.user) {
        throw createError(401, 'User not authenticated');
      }

      const { email, orgId } = value;
      const adminId = req.user.id;

      const result = await InviteService.sendInvite(email, orgId, adminId);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Validate invite link
   * GET /api/org/invite/:token
   */
  static async validateInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      console.log("token is",token)
      if (!token) {
        throw createError(400, 'Token is required');
      }

      const result = await InviteService.validateInvite(token);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Accept invite and create user
   * POST /api/org/invite/:token/accept
   */
  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { error, value } = acceptInviteSchema.validate(req.body);
      if (error) {
        throw createError(400, error.details[0].message);
      }

      const { token } = req.params;
      if (!token) {
        throw createError(400, 'Token is required');
      }

      const { name, password } = value;

      const result = await InviteService.acceptInvite(token, name, password);
      res.status(201).json({
        success: true,
        ...result
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Revoke a pending invite
   * DELETE /api/org/invite/:inviteId
   */
  static async revokeInvite(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'User not authenticated');
      }

      const { inviteId } = req.params;
      if (!inviteId) {
        throw createError(400, 'Invite ID is required');
      }

      const adminId = req.user.id;

      const result = await InviteService.revokeInvite(inviteId, adminId);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Get all invites for organization
   * GET /api/org/invite
   */
  static async getInvites(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'User not authenticated');
      }

      const { orgId } = req.params;
      if (!orgId || typeof orgId !== 'string') {
        throw createError(400, 'Organization ID is required');
      }

      const adminId = req.user.id;
      const invites = await InviteService.getOrganizationInvites(orgId, adminId);

      res.status(200).json({
        success: true,
        invites
      });
    } catch (err: any) {
      next(err);
    }
  }
}
