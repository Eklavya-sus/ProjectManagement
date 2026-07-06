import mongoose, {Document, Schema} from "mongoose";

export interface IOrganization extends Document{
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
    {
        name: { 
            type: String, 
            required: true,
            unique: true,
            trim: true
        },
    },
    { 
        timestamps: true
    }

);
 export const OrganizationModel = mongoose.model<IOrganization>('Organization', organizationSchema);