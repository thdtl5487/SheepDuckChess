import { Request, Response, NextFunction } from 'express';
import redis from '../shared/config/redis';
import { verifyToken } from '../shared/utils/jwt';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {

  const token = req.cookies?.token;

  // console.log(token);

  if(!token) return res.status(401).json({message: '로그인이 필요한 기능입니다.'});

  try{
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();

  }catch{
    return res.status(401).json({message: '유효하지 않은 토큰입니다.'});
  }
}