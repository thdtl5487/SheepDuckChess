import { Router, Request, Response } from 'express';
import { login, signUp } from '../controller/authController';
import authMiddleware from '../../middlewares/auth';

const router = Router();

// router.post('/signup', signup);
router.post('/signup', signUp)
router.post('/login', login);

export default router;