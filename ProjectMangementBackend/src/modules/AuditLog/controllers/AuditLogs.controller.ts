import { Response, NextFunction } from "express";
import { AuditLogService } from "../services/AuditLogs.service";
import { AuthenticateRequest } from "../../../middlewares/authMiddleware";
import createError from "http-errors";
import { UserModel } from "../../users/models/User.model";

export class AuditLogController {
  /**
   * Get organization audit logs (Admin view) - Fixed pagination
   */
  static async getOrganizationLogs(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const client = await UserModel.findById(user.id);
      // 🔒 SECURITY: Verify user belongs to this organization
      if (!client || client.organizationId?.toString() !== organizationId) {
        throw createError(403, "You can only view logs for your organization");
      }
      
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 50;
      const offset = (page - 1) * limit;

      const result = await AuditLogService.getOrganizationLogs(organizationId, limit, offset);
      const formattedLogs = AuditLogService.formatLogsForDisplay(result.logs);

      const totalPages = Math.ceil(result.totalCount / limit);

      res.status(200).json({
        message: "Audit logs retrieved successfully",
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: result.totalCount,
          totalPages,
          hasMore: result.hasMore,
          hasPrevious: page > 1
        }
      });
    } 
    catch (err) {
      next(err);
    }
  }

  /**
   * Get project activity logs (Project view) - Added pagination support
   */
  static async getProjectLogs(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { organizationId, projectId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const client = await UserModel.findById(user.id);
      // 🔒 SECURITY: Verify user belongs to this organization
      if (!client || client.organizationId?.toString() !== organizationId) {
        throw createError(403, "You can only view logs for your organization");
      }

      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 30;
      const offset = (page - 1) * limit;
      
      const result = await AuditLogService.getProjectLogs(organizationId, projectId, limit, offset);
      const formattedLogs = AuditLogService.formatLogsForDisplay(result.logs);

      const totalPages = Math.ceil(result.totalCount / limit);

      res.status(200).json({
        message: "Project activity retrieved successfully",
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: result.totalCount,
          totalPages,
          hasMore: result.hasMore,
          hasPrevious: page > 1
        }
      });
    } 
    catch (err) {
      next(err);
    }
  }

  /**
   * Get task activity logs (Task view) - Added pagination support
   */
  static async getTaskLogs(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { organizationId, taskId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }
      
      const client = await UserModel.findById(user.id);
      // 🔒 SECURITY: Verify user belongs to this organization
      if (!client || client.organizationId?.toString() !== organizationId) {
        throw createError(403, "You can only view logs for your organization");
      }

      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 30;
      const offset = (page - 1) * limit;

      const result = await AuditLogService.getTaskLogs(organizationId, taskId, limit, offset);
      const formattedLogs = AuditLogService.formatLogsForDisplay(result.logs);

      const totalPages = Math.ceil(result.totalCount / limit);

      res.status(200).json({
        message: "Task activity retrieved successfully",
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: result.totalCount,
          totalPages,
          hasMore: result.hasMore,
          hasPrevious: page > 1
        }
      });
    } 
    catch (err) {
      next(err);
    }
  }

  /**
   * Get filtered audit logs - New endpoint for advanced filtering
   */
  static async getFilteredLogs(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const client = await UserModel.findById(user.id);
      // 🔒 SECURITY: Verify user belongs to this organization
      if (!client || client.organizationId?.toString() !== organizationId) {
        throw createError(403, "You can only view logs for your organization");
      }

      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 50;
      const offset = (page - 1) * limit;

      // Parse filters from query params
      const filters: any = {};
      
      if (req.query.actions) {
        filters.actions = Array.isArray(req.query.actions) 
          ? req.query.actions 
          : (req.query.actions as string).split(',');
      }
      
      if (req.query.userId) {
        filters.userId = req.query.userId as string;
      }
      
      if (req.query.projectId) {
        filters.projectId = req.query.projectId as string;
      }
      
      if (req.query.taskId) {
        filters.taskId = req.query.taskId as string;
      }
      
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }
      
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      const result = await AuditLogService.getFilteredLogs(organizationId, filters, limit, offset);
      const formattedLogs = AuditLogService.formatLogsForDisplay(result.logs);

      const totalPages = Math.ceil(result.totalCount / limit);

      res.status(200).json({
        message: "Filtered audit logs retrieved successfully",
        logs: formattedLogs,
        filters,
        pagination: {
          page,
          limit,
          total: result.totalCount,
          totalPages,
          hasMore: result.hasMore,
          hasPrevious: page > 1
        }
      });
    } 
    catch (err) {
      next(err);
    }
  }

  // Add this method to your AuditLogController class

/**
 * Get combined project and task activity for a specific project
 */
static async getProjectActivity(req: AuthenticateRequest, res: Response, next: NextFunction) {
  try {
    const { organizationId, projectId } = req.params;
    const user = req.user;
    
    if (!user) {
      throw createError(401, "Authentication required");
    }

    const client = await UserModel.findById(user.id);
    // 🔒 SECURITY: Verify user belongs to this organization
    if (!client || client.organizationId?.toString() !== organizationId) {
      throw createError(403, "You can only view logs for your organization");
    }

    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 30;
    const offset = (page - 1) * limit;
    
    const result = await AuditLogService.getProjectActivity(organizationId, projectId, limit, offset);
    const formattedLogs = AuditLogService.formatLogsForDisplay(result.logs);

    const totalPages = Math.ceil(result.totalCount / limit);

    res.status(200).json({
      message: "Project activity retrieved successfully",
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: result.totalCount,
        totalPages,
        hasMore: result.hasMore,
        hasPrevious: page > 1
      }
    });
  } 
  catch (err) {
    next(err);
  }
}
}