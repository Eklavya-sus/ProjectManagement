import { ProjectModel, IProject } from '../models/Project.model';
import { UserModel } from '../../users/models/User.model';
import { OrganizationModel } from '../../organization/models/Organization.model';
import { AuditLogService } from '../../AuditLog/services/AuditLogs.service';
import { AuditAction } from '../../AuditLog/enums/AuditAction.enum';
import createError from 'http-errors';

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    name: string,
    description: string | undefined,
    organizationId: string,
    createdBy: string,
    members: string[] = [],
    priority?: 'low' | 'medium' | 'high',
    dueDate?: Date
  ) {
    // Verify the creator exists and belongs to the organization
    const creator = await UserModel.findById(createdBy);
    if (!creator) {
      throw createError(404, 'Creator user not found');
    }
    if (creator.organizationId?.toString() !== organizationId) {
      throw createError(403, 'You can only create projects in your organization');
    }

    // Verify organization exists
    const org = await OrganizationModel.findById(organizationId);
    if (!org) {
      throw createError(404, 'Organization not found');
    }

    // Verify all members belong to the same organization
    if (members.length > 0) {
      const memberUsers = await UserModel.find({ 
        _id: { $in: members },
        organizationId 
      });
      if (memberUsers.length !== members.length) {
        throw createError(400, 'All members must belong to the same organization');
      }
    }

    // Auto-add creator to members if not already included
    const uniqueMembers = Array.from(new Set([...members, createdBy]));

    // Create project
    const project = await ProjectModel.create({
      name,
      description,
      organizationId,
      createdBy,
      members: uniqueMembers,
      priority: priority || 'medium',
      dueDate
    });

    // Log the action
    await AuditLogService.log(
      AuditAction.PROJECT_CREATED,
      createdBy,
      organizationId,
      { 
        projectId: project._id,
        projectName: name,
        memberCount: uniqueMembers.length
      }
    );

    return {
      message: 'Project created successfully',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
        memberCount: uniqueMembers.length,
        createdAt: project.createdAt
      }
    };
  }

  /**
   * Get all projects for an organization
   */
  static async getOrganizationProjects(organizationId: string, userId: string) {
    // Verify user belongs to organization
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== organizationId) {
      throw createError(403, 'Access denied');
    }

    const projects = await ProjectModel
      .find({ organizationId })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    return projects.map(project => ({
      id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      dueDate: project.dueDate,
      createdBy: project.createdBy,
      memberCount: project.members.length,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
  }

  /**
   * Get a specific project
   */
  static async getProject(projectId: string, userId: string) {
    const project = await ProjectModel
      .findById(projectId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify user has access to this project
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    return {
      id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      dueDate: project.dueDate,
      createdBy: project.createdBy,
      members: project.members,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<Pick<IProject, 'name' | 'description' | 'priority' | 'dueDate'>>
  ) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify user has access
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    const oldValues = {
      name: project.name,
      description: project.description,
      priority: project.priority,
      dueDate: project.dueDate
    };

    // Update project
    Object.assign(project, updates);
    await project.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.PROJECT_UPDATED,
      userId,
      project.organizationId.toString(),
      { 
        projectId: project._id,
        projectName: project.name,
        changes: updates,
        oldValues
      }
    );

    return {
      message: 'Project updated successfully',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
        updatedAt: project.updatedAt
      }
    };
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(
    projectId: string,
    userId: string,
    newStatus: 'active' | 'completed' | 'archived'
  ) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify user has access
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    const oldStatus = project.status;
    project.status = newStatus;
    await project.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.PROJECT_STATUS_CHANGED,
      userId,
      project.organizationId.toString(),
      { 
        projectId: project._id,
        projectName: project.name,
        oldStatus,
        newStatus
      }
    );

    return {
      message: 'Project status updated successfully',
      project: {
        id: project._id,
        name: project.name,
        status: project.status,
        updatedAt: project.updatedAt
      }
    };
  }

  /**
   * Add member to project
   */
  static async addMemberToProject(projectId: string, userId: string, memberId: string) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify user has access
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    // Verify member exists and belongs to same organization
    const member = await UserModel.findById(memberId);
    if (!member || member.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(400, 'Member must belong to the same organization');
    }

    // Check if member is already in project
    if (project.members.includes(memberId as any)) {
      throw createError(400, 'Member is already part of this project');
    }

    // Add member
    project.members.push(memberId as any);
    await project.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.PROJECT_MEMBER_ADDED,
      userId,
      project.organizationId.toString(),
      { 
        projectId: project._id,
        projectName: project.name,
        addedMemberId: memberId,
        addedMemberName: member.name
      }
    );

    return {
      message: 'Member added to project successfully',
      project: {
        id: project._id,
        name: project.name,
        memberCount: project.members.length
      }
    };
  }

  /**
   * Remove member from project
   */
  static async removeMemberFromProject(projectId: string, userId: string, memberId: string) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify user has access
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    // Can't remove project creator
    if (project.createdBy.toString() === memberId) {
      throw createError(400, 'Cannot remove project creator');
    }

    // Check if member is in project
    const memberIndex = project.members.findIndex(m => m.toString() === memberId);
    if (memberIndex === -1) {
      throw createError(400, 'Member is not part of this project');
    }

    // Get member details for logging
    const member = await UserModel.findById(memberId);

    // Remove member
    project.members.splice(memberIndex, 1);
    await project.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.PROJECT_MEMBER_REMOVED,
      userId,
      project.organizationId.toString(),
      { 
        projectId: project._id,
        projectName: project.name,
        removedMemberId: memberId,
        removedMemberName: member?.name || 'Unknown'
      }
    );

    return {
      message: 'Member removed from project successfully',
      project: {
        id: project._id,
        name: project.name,
        memberCount: project.members.length
      }
    };
  }

  /**
   * Delete project (only creator or admin can delete)
   */
  static async deleteProject(projectId: string, userId: string) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    // Verify user has access
    const user = await UserModel.findById(userId);
    if (!user || user.organizationId?.toString() !== project.organizationId.toString()) {
      throw createError(403, 'Access denied');
    }

    // Only creator or admin can delete
    if (project.createdBy.toString() !== userId && user.role !== 'admin') {
      throw createError(403, 'Only project creator or organization admin can delete projects');
    }

    // Delete project
    await ProjectModel.findByIdAndDelete(projectId);

    // Log the action
    await AuditLogService.log(
      AuditAction.PROJECT_DELETED,
      userId,
      project.organizationId.toString(),
      { 
        projectId: project._id,
        projectName: project.name
      }
    );

    return {
      message: 'Project deleted successfully'
    };
  }
}