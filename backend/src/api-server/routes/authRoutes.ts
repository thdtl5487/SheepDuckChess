import { Router } from 'express';
// import { signup } from '../controller/authController';
import { login } from '../controller/authController';

const router = Router();

// router.post('/signup', signup);
router.post('/login', login);

export default router;