  import mongoose, { Schema, Document } from 'mongoose';

  export interface IAuditLog extends Document {
    action: string;
    performedBy: mongoose.Types.ObjectId;
    targetUser?: string; // email of invited user
    organizationId: mongoose.Types.ObjectId;
    details: any;
    createdAt: Date;
  }

  const auditLogSchema = new Schema<IAuditLog>({
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: String },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    details: { type: Schema.Types.Mixed },
  }, { timestamps: true });

  export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);