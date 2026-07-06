import { AuditLogModel } from '../models/AuditLogs.model';
import { AuditAction } from '../enums/AuditAction.enum';
import mongoose from 'mongoose';

export class AuditLogService {
  /**
   * Log an audit event
   * @param action - The action that occurred
   * @param performedBy - User ID who performed the action
   * @param organizationId - Organization ID where action occurred
   * @param details - Additional context (projectId, taskId, etc.)
   * @param targetUser - Optional email of affected user
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   */
  static async log(
    action: AuditAction,
    performedBy: string,
    organizationId: string,
    details: any = {},
    targetUser?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const auditLog = await AuditLogModel.create({
        action,
        performedBy,
        organizationId,
        details: {
          ...details,
          ...(ipAddress && { ipAddress }),
          ...(userAgent && { userAgent })
        },
        targetUser,
      });

      return auditLog;
    } catch (error) {
      // Log the error but don't throw - audit logging shouldn't break main flow
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Get audit logs for an organization with proper pagination
   */
  static async getOrganizationLogs(
    organizationId: string, 
    limit: number = 50,
    offset: number = 0
  ) {
    // Get total count for pagination
    const totalCount = await AuditLogModel.countDocuments({ organizationId });
    
    // Get paginated results
    const logs = await AuditLogModel
      .find({ organizationId })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      logs,
      totalCount,
      hasMore: offset + logs.length < totalCount
    };
  }

  /**
   * Get audit logs for a specific project with pagination
   */
  static async getProjectLogs(
    organizationId: string,
    projectId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const query = { 
      organizationId,
      'details.projectId': projectId 
    };

    const totalCount = await AuditLogModel.countDocuments(query);
    
    const logs = await AuditLogModel
      .find(query)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      logs,
      totalCount,
      hasMore: offset + logs.length < totalCount
    };
  }

  /**
   * Get audit logs for a specific task with pagination
   */
  static async getTaskLogs(
    organizationId: string,
    taskId: string,
    limit: number = 30,
    offset: number = 0
  ) {
    const query = { 
      organizationId,
      'details.taskId': new mongoose.Types.ObjectId(taskId)
    };

    const totalCount = await AuditLogModel.countDocuments(query);
    
    const logs = await AuditLogModel
      .find(query)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      logs,
      totalCount,
      hasMore: offset + logs.length < totalCount
    };
  }

  // Add this method to your AuditLogService class

/**
 * Get combined project and task activity logs for a specific project
 * This includes both project-level actions and task-level actions within the project
 */
static async getProjectActivity(
  organizationId: string,
  projectId: string,
  limit: number = 50,
  offset: number = 0
) {
  // Query for both project actions and task actions within this project
  const query = {
    organizationId,
    $or: [
      // Direct project actions
      { 
        action: { 
          $in: ['PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'PROJECT_STATUS_CHANGED', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED'] 
        },
        'details.projectId': new mongoose.Types.ObjectId(projectId)
      },
      // Task actions within this project
      { 
        action: { 
          $in: ['TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'TASK_ASSIGNED', 'TASK_REASSIGNED', 'TASK_UNASSIGNED', 'TASK_STATUS_CHANGED'] 
        },
        'details.projectId': new mongoose.Types.ObjectId(projectId)
      }
    ]
  };

  const totalCount = await AuditLogModel.countDocuments(query);
  
  const logs = await AuditLogModel
    .find(query)
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);

  return {
    logs,
    totalCount,
    hasMore: offset + logs.length < totalCount
  };
}

  /**
   * Get audit logs with advanced filtering options
   */
  static async getFilteredLogs(
    organizationId: string,
    filters: {
      actions?: string[];
      userId?: string;
      projectId?: string;
      taskId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    limit: number = 50,
    offset: number = 0
  ) {
    const query: any = { organizationId };

    // Apply filters
    if (filters.actions && filters.actions.length > 0) {
      query.action = { $in: filters.actions };
    }

    if (filters.userId) {
      query.performedBy = filters.userId;
    }

    if (filters.projectId) {
      query['details.projectId'] = filters.projectId;
    }

    if (filters.taskId) {
      query['details.taskId'] = filters.taskId;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo;
      }
    }

    const totalCount = await AuditLogModel.countDocuments(query);
    
    const logs = await AuditLogModel
      .find(query)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      logs,
      totalCount,
      hasMore: offset + logs.length < totalCount
    };
  }

  /**
   * Format logs for frontend display
   */
  static formatLogsForDisplay(logs: any[]) {
    return logs.map(log => {
      const baseLog = {
        id: log._id,
        action: log.action,
        performedBy: log.performedBy,
        targetUser: log.targetUser,
        createdAt: log.createdAt,
        details: log.details
      };

      // Generate human-readable message
      const message = this.generateLogMessage(log);
      
      return {
        ...baseLog,
        message,
        displayData: this.extractDisplayData(log)
      };
    });
  }

  /**
   * Generate human-readable messages from logs
   */
  private static generateLogMessage(log: any): string {
    const userName = log.performedBy?.name || 'Unknown User';
    const action = log.action;
    const details = log.details || {};

    switch (action) {
      // User Management
      case 'INVITE_SENT':
        return `${userName} invited ${log.targetUser}`;
      case 'INVITE_ACCEPTED':
        return `${log.targetUser} joined the organization`;
      case 'INVITE_REVOKED':
        return `${userName} revoked invite for ${log.targetUser}`;

      // Project Management  
      case 'PROJECT_CREATED':
        return `${userName} created project "${details.projectName}"`;
      case 'PROJECT_UPDATED':
        return `${userName} updated project "${details.projectName}"`;
      case 'PROJECT_STATUS_CHANGED':
        return `${userName} changed project "${details.projectName}" status from ${details.oldStatus} to ${details.newStatus}`;
      case 'PROJECT_MEMBER_ADDED':
        return `${userName} added ${details.addedMemberName} to project "${details.projectName}"`;
      case 'PROJECT_MEMBER_REMOVED':
        return `${userName} removed ${details.removedMemberName} from project "${details.projectName}"`;
      case 'PROJECT_DELETED':
        return `${userName} deleted project "${details.projectName}"`;

      // Task Management
      case 'TASK_CREATED':
        return `${userName} created task "${details.taskTitle}" in ${details.projectName}`;
      case 'TASK_UPDATED':
        return `${userName} updated task "${details.taskTitle}"`;
      case 'TASK_STATUS_CHANGED':
        return `${userName} moved "${details.taskTitle}" from ${details.oldStatus} to ${details.newStatus}`;
      case 'TASK_ASSIGNED':
        return `${userName} assigned "${details.taskTitle}" to ${details.assignedToName}`;
      case 'TASK_REASSIGNED':
        return `${userName} reassigned "${details.taskTitle}" from ${details.previousAssigneeName} to ${details.assignedToName}`;
      case 'TASK_UNASSIGNED':
        return `${userName} unassigned "${details.taskTitle}" from ${details.previousAssigneeName}`;
      case 'TASK_DELETED':
        return `${userName} deleted task "${details.taskTitle}" from ${details.projectName}`;

      default:
        return `${userName} performed ${action}`;
    }
  }

  /**
   * Extract display-friendly data from logs
   */
  private static extractDisplayData(log: any) {
    const details = log.details || {};
    
    return {
      projectId: details.projectId,
      projectName: details.projectName,
      taskId: details.taskId,
      taskTitle: details.taskTitle,
      // Add more fields that might be useful for frontend
      hasProject: !!details.projectId,
      hasTask: !!details.taskId,
      actionCategory: this.getActionCategory(log.action)
    };
  }

  /**
   * Categorize actions for frontend filtering
   */
  private static getActionCategory(action: string): string {
    if (action.includes('INVITE')) return 'user_management';
    if (action.includes('PROJECT')) return 'project_management';
    if (action.includes('TASK')) return 'task_management';
    return 'other';
  }
}