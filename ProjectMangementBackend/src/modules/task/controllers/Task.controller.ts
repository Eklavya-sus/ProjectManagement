import { Response, NextFunction } from "express";
import { TaskService } from "../services/Task.service";
import { AuthenticateRequest } from "../../../middlewares/authMiddleware";
import createError from "http-errors";

export class TaskController {
  static async create(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, assignedTo, priority, dueDate } = req.body;
      const { projectId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const task = await TaskService.createTask(
        title,
        description,
        projectId,
        user.id,
        assignedTo,
        priority,
        dueDate ? new Date(dueDate) : undefined
      );

      res.status(201).json({
        message: "Task created successfully",
        task
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async getProjectTasks(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const tasks = await TaskService.getProjectTasks(projectId, user.id);

      res.status(200).json({
        message: "Tasks retrieved successfully",
        tasks
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const task = await TaskService.getTask(taskId, user.id);

      res.status(200).json({
        message: "Task retrieved successfully",
        task
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const updates = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      // Convert dueDate string to Date if provided
      if (updates.dueDate) {
        updates.dueDate = new Date(updates.dueDate);
      }

      const task = await TaskService.updateTask(taskId, user.id, updates);

      res.status(200).json({
        message: "Task updated successfully",
        task
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const { status } = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const task = await TaskService.updateTaskStatus(taskId, user.id, status);

      res.status(200).json({
        message: "Task status updated successfully",
        task
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async assign(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const { assigneeId } = req.body;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const task = await TaskService.assignTask(taskId, user.id, assigneeId);

      res.status(200).json({
        message: "Task assigned successfully",
        task
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async unassign(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const task = await TaskService.unassignTask(taskId, user.id);

      res.status(200).json({
        message: "Task unassigned successfully",
        task
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const user = req.user;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      await TaskService.deleteTask(taskId, user.id);

      res.status(200).json({
        message: "Task deleted successfully"
      });
    } 
    catch (err) {
      next(err);
    }
  }

  static async getUserTasks(req: AuthenticateRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { status } = req.query;
      
      if (!user) {
        throw createError(401, "Authentication required");
      }

      const tasks = await TaskService.getUserTasks(user.id, status as string);

      res.status(200).json({
        message: "User tasks retrieved successfully",
        tasks
      });
    } 
    catch (err) {
      next(err);
    }
  }
}