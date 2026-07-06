import { Response, NextFunction } from "express";
import { ProjectService } from "../services/Project.service";
import { AuthenticateRequest } from "../../../middlewares/authMiddleware";
import createError from "http-errors";

export class ProjectController {
  static async create(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, members = [], priority, dueDate } = req.body;
      const { organizationId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const project = await ProjectService.createProject(
        name,
        description,
        organizationId,
        user.id,
        members,
        priority,
        dueDate ? new Date(dueDate) : undefined
      );

      res.status(201).json({
        message: "Project created successfully",
        project
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async getOrganizationProjects(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const projects = await ProjectService.getOrganizationProjects(organizationId, user.id);

      res.status(200).json({
        message: "Projects retrieved successfully",
        projects
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const project = await ProjectService.getProject(projectId, user.id);

      res.status(200).json({
        message: "Project retrieved successfully",
        project
      });
    } 
    catch (err) {
      console.error(err)
      next(err);
    }
  }

  static async update(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const updates = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      // Convert dueDate string to Date if provided
      if (updates.dueDate) {
        updates.dueDate = new Date(updates.dueDate);
      }

      const project = await ProjectService.updateProject(projectId, user.id, updates);

      res.status(200).json({
        message: "Project updated successfully",
        project
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const { status } = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const project = await ProjectService.updateProjectStatus(projectId, user.id, status);

      res.status(200).json({
        message: "Project status updated successfully",
        project
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async addMember(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const { memberId } = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const project = await ProjectService.addMemberToProject(projectId, user.id, memberId);

      res.status(200).json({
        message: "Member added to project successfully",
        project
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async removeMember(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: projectId, memberId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const project = await ProjectService.removeMemberFromProject(projectId, user.id, memberId);

      res.status(200).json({
        message: "Member removed from project successfully",
        project
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      await ProjectService.deleteProject(projectId, user.id);

      res.status(200).json({
        message: "Project deleted successfully"
      });
    } 
    catch (err) {
      next(err);
    }
  }
}