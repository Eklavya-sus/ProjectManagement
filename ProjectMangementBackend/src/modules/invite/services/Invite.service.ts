// src/services/Invite.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel, IUser } from '../../users/models/User.model';
import { OrganizationModel } from '../../organization/models/Organization.model';
import { InviteModel, IInvite } from '../models/Invite.model';
import { sendEmail } from '../../../utils/sendEmail';
import createError from 'http-errors';
import { AuditLogService } from '../../AuditLog/services/AuditLogs.service';
import { AuditAction } from '../../AuditLog/enums/AuditAction.enum';

const SECRET = process.env.JWT_SECRET || '4f1c8653d36d4998a1e7d7d9e6c19f4d8e33c2c34e7c432b9f8fdddbb07b3c2f';
const FRONTEND_URL = 'http://localhost:3000';

export class InviteService {
  /**
   * Send an invite to a new user
   * @param email Email of the invited user
   * @param orgId Organization ID
   * @param adminId ID of the admin sending the invite
   */
  static async sendInvite(email: string, orgId: string, adminId: string) {
    // Check if the user sending invite is an admin
    const admin = await UserModel.findById(adminId);
    if (!admin) {
      throw createError(404, 'Admin user not found');
    }
    if (admin.role !== 'admin') {
      throw createError(403, 'Only administrators can send invites');
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) throw createError(400, 'User with this email already exists');

    // Check if organization exists and admin belongs to it
    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      throw createError(404, 'Organization not found');
    }
    if (admin.organizationId?.toString() !== orgId) {
      throw createError(403, 'You can only send invites for your organization');
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await InviteModel.findOne({ 
      email, 
      organizationId: orgId, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    if (existingInvite) {
      throw createError(400, 'An active invite already exists for this email');
    }

    // Create JWT token with 7-day expiry
    const token = jwt.sign({ email, orgId }, SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save invite in DB
    const invite = await InviteModel.create({
      email,
      organizationId: orgId,
      token,
      status: 'pending',
      createdBy: adminId,
      expiresAt,
    });

    // Log the action
    await AuditLogService.log(
      AuditAction.INVITE_SENT,
      adminId,
      orgId,
      { inviteId: invite._id, token: token.substring(0, 10) + '...' },
      email,
    );
    
    // Send email
    const inviteLink = `${FRONTEND_URL}/invite/${token}`;
    await sendEmail(
      email, 
      `Invitation to join ${org.name}`,
      `You've been invited to join ${org.name}. Click here to accept: ${inviteLink}\n\nThis invite expires in 7 days.`
    );

    return { 
      message: 'Invite sent successfully', 
      invite: {
        id: invite._id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt
      }
    };
  }

  /**
   * Validate an invite token
   * @param token JWT token from invite link
   */
  static async validateInvite(token: string) {
    try {
      const invite = await InviteModel.findOne({ token }).populate('organizationId', 'name');

      if (!invite) {
        throw createError(404, 'Invite not found');
      }
      if (invite.status !== 'pending') {
        throw createError(400, 'Invite has already been used');
      }
      if (invite.expiresAt < new Date()) {
        throw createError(400, 'Invite has expired');
      }

      return { 
        email: invite.email, 
        organizationId: invite.organizationId,
        organizationName: (invite.organizationId as any).name
      };
    } catch (err: any) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        throw createError(400, 'Invalid or expired invite token');
      }
      throw err;
    }
  }

  /**
   * Accept an invite and create a new user
   * @param token JWT token from invite link
   * @param name Name of the invited user
   * @param password Password of the invited user
   */
  static async acceptInvite(token: string, name: string, password: string) {
    try {
      // Step 1: Verify JWT (ensures token integrity & basic expiry)
  try {
    jwt.verify(token, SECRET);
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      throw createError(400, 'Invalid or expired invite token');
    }
    throw err;
  }

      // Step 2: Database validation (authoritative state check)
  const invite = await InviteModel.findOne({ token });
  if (!invite) {
    throw createError(404, 'Invite not found');
  }
  if (invite.status !== 'pending') {
    throw createError(400, 'Invite has already been used');
  }
  if (invite.expiresAt < new Date()) {
    throw createError(400, 'Invite has expired');
  }

      // Step 3: Check if user already exists
  const existingUser = await UserModel.findOne({ email: invite.email });
  if (existingUser) {
    throw createError(400, 'User with this email already exists');
  }

      // Step 4: Create user
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser: IUser = await UserModel.create({
    name,
    email: invite.email,
    password: hashedPassword,
    role: 'member',
    organizationId: invite.organizationId,
  });

  // Step 5: Mark invite as accepted (atomic operation)
  invite.status = 'accepted';
  invite.usedAt = new Date();
  await invite.save();

  // Step 6: Audit log
  await AuditLogService.log(
    AuditAction.INVITE_ACCEPTED,
    newUser.id,
    invite.organizationId.toString(),
    { inviteId: invite._id, userId: newUser._id },
    invite.email,
  );


      return { 
    message: 'Account created successfully', 
    user: { 
      id: newUser._id,
      name: newUser.name, 
      email: newUser.email, 
      role: newUser.role 
    } 
  };
    } catch (err) {
      throw createError('Invalid or expired invite link');
    }
  }

  /**
   * Revoke a pending invite
   */
  static async revokeInvite(inviteId: string, adminId: string, ipAddress?: string, userAgent?: string) {
    // Check if the user is an admin
    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw createError(403, 'Only administrators can revoke invites');
    }

    const invite = await InviteModel.findById(inviteId);
    if (!invite) {
      throw createError(404, 'Invite not found');
    }

    // Check if admin can revoke this invite (same organization)
    if (admin.organizationId?.toString() !== invite.organizationId.toString()) {
      throw createError(403, 'You can only revoke invites from your organization');
    }

    if (invite.status !== 'pending') {
      throw createError(400, 'Can only revoke pending invites');
    }

    // Mark invite as revoked (we'll add this status to the schema)
    invite.status = 'revoked' as any;
    await invite.save();

    // Log the action
    await AuditLogService.log(
      AuditAction.INVITE_REVOKED,
      adminId,
      invite.organizationId.toString(),
      { inviteId: invite._id },
      invite.email,
      ipAddress,
      userAgent
    );

    return { message: 'Invite revoked successfully' };
  }

  /**
   * Get all invites for an organization (admin only)
   */
  static async getOrganizationInvites(orgId: string, adminId: string) {
    // Check if the user is an admin
    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw createError(403, 'Only administrators can view invites');
    }

    // Check if admin belongs to the organization
    if (admin.organizationId?.toString() !== orgId) {
      throw createError(403, 'You can only view invites for your organization');
    }

    const invites = await InviteModel.find({ organizationId: orgId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return invites.map(invite => ({
      id: invite._id,
      email: invite.email,
      status: invite.status,
      createdBy: invite.createdBy,
      createdAt: invite.createdAt,
      usedAt: invite.usedAt,
      expiresAt: invite.expiresAt
    }));
  }
}
