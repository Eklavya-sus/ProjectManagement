import { TaskModel, ITask } from '../models/Task.model';
import { ProjectModel } from '../../project/models/Project.model';
import { UserModel } from '../../users/models/User.model';
import { AuditLogService } from '../../AuditLog/services/AuditLogs.service';
import { AuditAction } from '../../AuditLog/enums/AuditAction.enum';
import createError from 'http-errors';

export class TaskService {
  /**
   * Create a new task
   */
  static async createTask(
    title: string,
    description: string | undefined,
    projectId: string,
    createdBy: string,
    assignedTo?: string,
    priority?: 'low' | 'medium' | 'high',
    dueDate?: Date
  ) {
    // Verify project exists and user has access
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify creator has access to project
    const creator = await UserModel.findById(createdBy);
    if (!creator || creator.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    // If assignedTo is provided, verify they have access to project
    if (assignedTo) {
      const assignee = await UserModel.findById(assignedTo);
      if (!assignee || assignee.organizationId?.toString() !== project.organizationId.toString()) {
        throw createError(400, 'Assignee must belong to the same organization');
      }
    }

    // Create task
    const task = await TaskModel.create({
      title,
      description,
      projectId,
      createdBy,
      assignedTo,
      priority: priority || 'medium',
      dueDate
    });

    // Log the action
    await AuditLogService.log(
      AuditAction.TASK_CREATED,
      createdBy,
      project.organizationId.toString(),
      { 
        taskId: task._id,
        taskTitle: title,
        projectId,
        projectName: project.name,
        ...(assignedTo && { assignedTo })
      }
    );

    return {
      message: 'Task created successfully',
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        createdAt: task.createdAt
      }
    };
  }

  /**
   * Get all tasks for a project
   */
  static async getProjectTasks(projectId: string, userId: string) {
    // Verify project exists and user has access
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    const tasks = await TaskModel
      .find({ projectId })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      dueDate: task.dueDate,
      project: projectId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
  }

  /**
   * Get a specific task
   */
  static async getTask(taskId: string, userId: string) {
    const task = await TaskModel
      .findById(taskId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');

    if (!task) {
      throw createError(404, 'Task not found');
    }

    // Verify user has access
    const project = await ProjectModel.findById(task.projectId);
    const user = await UserModel.findById(userId);
    if (!user || !project || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    return {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      project: task.projectId,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  /**
   * Update task
   */
  static async updateTask(
    taskId: string,
    userId: string,
    updates: Partial<Pick<ITask, 'title' | 'description' | 'priority' | 'dueDate'>>
  ) {
    const task = await TaskModel.findById(taskId).populate('projectId');
    if (!task) {
      throw createError(404, 'Task not found');
    }

    // Verify user has access
    const project = await ProjectModel.findById(task.projectId);
    const user = await UserModel.findById(userId);
    if (!user || !project || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    const oldValues = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate
    };

    // Update task
    Object.assign(task, updates);
    await task.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.TASK_UPDATED,
      userId,
      project.organizationId.toString(),
      { 
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: project.name,
        changes: updates,
        oldValues
      }
    );

    return {
      message: 'Task updated successfully',
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        updatedAt: task.updatedAt
      }
    };
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    userId: string,
    newStatus: 'todo' | 'in_progress' | 'review' | 'done'
  ) {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    // Verify user has access
    const project = await ProjectModel.findById(task.projectId);
    const user = await UserModel.findById(userId);
    if (!user || !project || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    const oldStatus = task.status;
    task.status = newStatus;
    await task.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.TASK_STATUS_CHANGED,
      userId,
      project.organizationId.toString(),
      { 
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: project.name,
        oldStatus,
        newStatus
      }
    );

    return {
      message: 'Task status updated successfully',
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        updatedAt: task.updatedAt
      }
    };
  }

  /**
   * Assign task to user
   */
  static async assignTask(taskId: string, userId: string, assigneeId: string) {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    // Verify user has access
    const project = await ProjectModel.findById(task.projectId);
    const user = await UserModel.findById(userId);
    if (!user || !project || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    // Verify assignee exists and has access
    const assignee = await UserModel.findById(assigneeId);
    if (!assignee || assignee.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(400, 'Assignee must belong to the same organization');
    }

    const wasReassign = !!task.assignedTo;
    const oldAssignee = task.assignedTo ? await UserModel.findById(task.assignedTo) : null;

    task.assignedTo = assigneeId as any;
    await task.save();

    // Log the action
    await AuditLogService.log(
      wasReassign ? AuditAction.TASK_REASSIGNED : AuditAction.TASK_ASSIGNED,
      userId,
      project.organizationId.toString(),
      { 
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: project.name,
        assignedTo: assigneeId,
        assignedToName: assignee.name,
        ...(wasReassign && {
          previousAssignee: oldAssignee?._id,
          previousAssigneeName: oldAssignee?.name
        })
      }
    );

    return {
      message: wasReassign ? 'Task reassigned successfully' : 'Task assigned successfully',
      task: {
        id: task._id,
        title: task.title,
        assignedTo: {
          id: assignee._id,
          name: assignee.name,
          email: assignee.email
        },
        updatedAt: task.updatedAt
      }
    };
  }

  /**
   * Unassign task
   */
  static async unassignTask(taskId: string, userId: string) {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    if (!task.assignedTo) {
      throw createError(400, 'Task is not assigned to anyone');
    }

    // Verify user has access
    const project = await ProjectModel.findById(task.projectId);
    const user = await UserModel.findById(userId);
    if (!user || !project || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    const previousAssignee = await UserModel.findById(task.assignedTo);
    task.assignedTo = undefined;
    await task.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.TASK_UNASSIGNED,
      userId,
      project.organizationId.toString(),
      { 
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: project.name,
        previousAssignee: previousAssignee?._id,
        previousAssigneeName: previousAssignee?.name
      }
    );

    return {
      message: 'Task unassigned successfully',
      task: {
        id: task._id,
        title: task.title,
        assignedTo: null,
        updatedAt: task.updatedAt
      }
    };
  }

  /**
   * Delete task
   */
  static async deleteTask(taskId: string, userId: string) {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    // Verify user has access
    const project = await ProjectModel.findById(task.projectId);
    const user = await UserModel.findById(userId);
    if (!user || !project || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    // Delete task
    await TaskModel.findByIdAndDelete(taskId);

    // Log the action
    await AuditLogService.log(
      AuditAction.TASK_DELETED,
      userId,
      project.organizationId.toString(),
      { 
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: project.name
      }
    );

    return {
      message: 'Task deleted successfully'
    };
  }

  /**
   * Get tasks assigned to a user
   */
  static async getUserTasks(userId: string, status?: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    const query: any = { assignedTo: userId };
    if (status) {
      query.status = status;
    }

    const tasks = await TaskModel
      .find(query)
      .populate('createdBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    return tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      project: task.projectId,
      createdBy: task.createdBy,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
  }
}