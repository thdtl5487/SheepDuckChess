import { Router, Request, Response } from 'express';
import authMiddleware from '../../middlewares/auth';

interface AuthedRequest extends Request{
    user?: {
        usn: number;
    }
}

const authTestRouter = Router();

// 인증 미들웨어가 붙은 테스트 라우터
authTestRouter.get('/auth-test', authMiddleware, (req: AuthedRequest, res: Response) => {
  res.json({
    message: `인증 성공!`,
    usn: req.user?.usn,
  });
});

export default authTestRouter;
