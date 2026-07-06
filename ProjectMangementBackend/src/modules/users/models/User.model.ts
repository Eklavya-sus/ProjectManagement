import mongoose, {Document, Schema} from "mongoose";

export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'member';
    organizationId?: mongoose.Types.ObjectId;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { 
            type: String, 
            required: true 
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password:{
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin','member'],
            default: 'member',
        },
        organizationId: { 
            type: Schema.Types.ObjectId, 
            ref: "Organization", 
            required: false,
            index: true
        },
        avatar: { 
            type: String 
        },
    },
    { 
        timestamps: true
    }

);
 export const UserModel = mongoose.model<IUser>('User', userSchema);