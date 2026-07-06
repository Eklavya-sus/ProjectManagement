import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/User.service";
import { AuthenticateRequest } from "../../../middlewares/authMiddleware";
import createError from "http-errors";

export class UserController {
    static async register(req: Request, res: Response, next: NextFunction){
        try{
            const { name, email, password, role } = req.body;
            const user = await UserService.register(name, email, password, role);

            res.status(201).json({
                message: 'User registered Successfully',
                user
            });
        }
        catch(err){
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction){
        try{
            const {email, password} = req.body;
            const result = await UserService.login(email,password);

            res.status(200).json({
                message: "Login Successful",
                ...result,
            })
        }
        catch(err){
            next(err);
        }
    }

    static async getProfile(req: AuthenticateRequest, res: Response, next: NextFunction){
        try{
            const user = req.user;
            if(!user){
                throw createError(400,"Bad Request")
            }
            const userInfo = await UserService.getProfile(user.id);
            console.log(userInfo)
            res.status(200).json({userInfo});
        }
        catch(err){
            next(err);
        }
    }
}