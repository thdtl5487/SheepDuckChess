import {Request, Response, NextFunction } from 'express';
import redis from '../shared/config/redis';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) =>{
    try{

        // 1. 헤더에서 토큰 추출 과정 ---
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer')){
            return res.status(401).json({message: '토큰이 없다 ㅜㅜ'});
        }

        const reqToken = authHeader.split(' ')[1];

        // 1 end ---

        // 2. 유저 식별자 추출, 클라에서 보내줘야 함.
        const usn = req.headers['x-user-id'];

        // 3. Redis에서 저장된 토큰 가져오기
        const redisToken = await redis.get(`auth_token${usn}`);

        if(!redisToken){
            return res.status(401).json({
                message: `로그인 세션 없음 (만료 또는 삭제)`
            });
        };

        // 4. 토큰 일치 여부 확인
        if(redisToken !== reqToken){
            return res.status(401).json({message: '이미 로그인 되어있습니다. 기존 로그인을 종료합니다.'})
        }

        // 5. 토큰 갱신
        await redis.expire(`auth_token${usn}`, 1800);

        // 6. 요청에 유저정보 추가 후 다음 라우터로 넘김
        req.user = { usn: Number(usn) };
        next();


    }catch(err){
        return res.status(500).json({message: '서버 오류'})
    }
}

export default authMiddleware;