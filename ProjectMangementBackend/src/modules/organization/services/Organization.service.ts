import { OrganizationModel } from "../models/Organization.model";
import { UserModel } from "../../users/models/User.model";
import createError from "http-errors";
import mongoose from "mongoose";

export class OrganizationService {
  static async create(name: string, userId: string) {
    // Check if user already has an organization
    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError(404, "User not found");
    }

    if (user.organizationId) {
      throw createError(400, "User already belongs to an organization");
    }

    // Check if user is admin (only admins can create orgs)
    if (user.role !== 'admin') {
      throw createError(403, "Only admins can create organizations");
    }

    // Check if organization name already exists
    const existingOrg = await OrganizationModel.findOne({ name });
    if (existingOrg) {
      throw createError(400, "Organization name already exists");
    }

    // Create organization
    const organization = new OrganizationModel({
      name
    });

    await organization.save();

    // Update user with organization ID
    user.organizationId = organization._id as mongoose.Types.ObjectId;
    await user.save();

    return {
      id: organization._id,
      name: organization.name,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    };
  }
  
  static async getById(orgId: string, userId: string) {
    // Validate orgId format
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      throw createError(400, "Invalid organization ID");
    }

    // Get user to verify they belong to this organization
    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError(404, "User not found");
    }

    if (!user.organizationId) {
      throw createError(404, "User has no organization");
    }

    // Authorization check - user can only access their own org
    if (user.organizationId.toString() !== orgId) {
      throw createError(403, "Access denied to this organization");
    }

    // Fetch organization details
    const organization = await OrganizationModel.findById(orgId);
    if (!organization) {
      throw createError(404, "Organization not found");
    }

    // Find the admin of this organization
    const admin = await UserModel.findOne({
      organizationId: orgId,
      role: 'admin'
    }).select('_id name email');

    if (!admin) {
      throw createError(500, "Organization admin not found");
    }

    return {
      id: organization._id,
      name: organization.name,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    };
  }
  
  static async getUsers(
    orgId: string,
    requesterId: string,
    page?: number,
    limit?: number
  ) {
    // 1) Validate orgId
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      throw createError(400, "Invalid organization ID");
    }

    // 2) Ensure requester exists and belongs to this org
    const requester = await UserModel.findById(requesterId).select("_id organizationId");
    if (!requester) throw createError(404, "User not found");

    if (!requester.organizationId || requester.organizationId.toString() !== orgId) {
      throw createError(403, "Access denied to this organization");
    }

    // 3) Base query
    let query = UserModel.find({ organizationId: orgId })
      .select("_id name email role "); // never return password

    // 4) Optional pagination
    if (page && limit) {
      const totalUsers = await UserModel.countDocuments({ organizationId: orgId });
      const users = await query
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        users,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      };
    }

    // 5) No pagination → return all
    const users = await query;
    return { users };
  }
}