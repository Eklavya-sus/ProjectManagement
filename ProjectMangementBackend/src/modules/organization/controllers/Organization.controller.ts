import { Response, NextFunction } from "express";
import { OrganizationService } from "../services/Organization.service";
import { AuthenticateRequest } from "../../../middlewares/authMiddleware";
import createError from "http-errors";

export class OrganizationController {
  static async create(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const organization = await OrganizationService.create(name, user.id);

      res.status(201).json({
        message: "Organization created successfully",
        organization
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: orgId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const organization = await OrganizationService.getById(orgId, user.id);

      res.status(200).json({
        message: "Organization retrieved successfully",
        organization
      });
    } 
    catch (err) {
      next(err);
    }
  }

static async getUsers(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: orgId } = req.params;
      const authUser = req.user;

      if (!authUser) throw createError(401, "Authentication required");

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const data = await OrganizationService.getUsers(orgId, authUser.id, page, limit);

      res.status(200).json({
        message: "Organization users retrieved successfully",
        ...data, // either { users } OR { users, pagination }
      });
    } catch (err) {
      next(err);
    }
  }
}