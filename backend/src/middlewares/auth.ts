import { Response, NextFunction } from 'express';
import redis from '../shared/config/redis';

const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return res.status(401).json({ message: '토큰이 없다 ㅜㅜ' });
    }

    const reqToken = authHeader.split(' ')[1];
    console.log(`authHeader : ${authHeader}`)
    const usn = req.headers['x-user-id'];
    const redisToken = await redis.get(`auth_token:${usn}`);

    if (!redisToken) {
      return res.status(401).json({
        message: `로그인 세션 없음 (만료 또는 삭제)`,
      });
    }

    if (redisToken !== reqToken) {
        console.log(`reqToken : ${reqToken} / redisToken : ${redisToken}`)
      return res.status(401).json({ message: '이미 로그인 되어있습니다. 기존 로그인을 종료합니다.' });
    }

    await redis.expire(`auth_token${usn}`, 1800);
    req.user = { usn: Number(usn) };
    next();
  } catch (err) {
    return res.status(500).json({ message: '서버 오류' });
  }
};

export default authMiddleware;
