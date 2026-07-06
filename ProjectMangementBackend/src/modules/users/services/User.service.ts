import bcrypt from "bcrypt";
import { IUser, UserModel } from "../models/User.model";
import createError from "http-errors";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export class UserService {
  static async register(
    name: string,
    email: string,
    password: string,
    role: "admin" | "member",
  ) {
    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw createError(400, "Email already registered. Please Login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  static async login(email: string, password: string) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw createError(401, "Invalid credentials");
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      throw createError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async getProfile(userId: string){
    const user = await UserModel.findById(userId).select("-password");  
    if(!user){
      throw createError(404,"User not found")
    }

    return{
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    }
  }
}
