import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[]; // Array of user IDs who are part of this project
  status: 'active' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String,
      maxlength: 500 
    },
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Organization', 
      required: true,
      index: true
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    members: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    dueDate: { 
      type: Date 
    }
  },
  { 
    timestamps: true
  }
);

// Indexes for better performance
// projectSchema.index({ organizationId: 1, status: 1 });
// projectSchema.index({ organizationId: 1, createdAt: -1 });
// projectSchema.index({ members: 1 });

export const ProjectModel = mongoose.model<IProject>('Project', projectSchema);