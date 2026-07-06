import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  email: string;
  organizationId: mongoose.Types.ObjectId;
  token: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdBy: mongoose.Types.ObjectId; // admin who sent the invite
  createdAt: Date;
  usedAt?: Date;
  expiresAt: Date;
}

const inviteSchema = new Schema<IInvite>({
  email: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  token: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usedAt: { type: Date },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const InviteModel = mongoose.model<IInvite>('Invite', inviteSchema);
