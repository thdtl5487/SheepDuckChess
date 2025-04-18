import {Router, Request, Response} from 'express';
import authMiddleware from '../../middlewares/auth';

const testRouter = Router();

testRouter.get('/protected', authMiddleware, (req: Request, res: Response) =>{
    res.json({
        message: `인증 성공~ usn: ${req.user?.usn}`,
    });
});

export default testRouter;