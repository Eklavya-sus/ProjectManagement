import express from 'express';
import { registerSchema } from '../validators/registerSchema';
import { validateRequest } from '../../../middlewares/validateRequest';
import { UserController } from '../controller/User.controller';
import { loginSchema } from '../validators/loginSchema';
import { authenticate } from '../../../middlewares/authMiddleware';


const router = express.Router();

router.post('/register',validateRequest(registerSchema),UserController.register);
router.post('/login',validateRequest(loginSchema),UserController.login);
router.get("/me", authenticate, UserController.getProfile); 
export default router;