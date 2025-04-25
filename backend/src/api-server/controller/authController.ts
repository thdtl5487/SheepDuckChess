import { Request, Response } from 'express';
import pool from '../../shared/config/pool';
import redis from '../../shared/config/redis';
import { v4 as uuidv4 } from 'uuid';
import * as authService from '../services/authService';
import { signToken, verifyToken } from '../../shared/utils/jwt';
import { verify } from 'crypto';


// 중복 로그인 확인용, 중복 로그인 확인 시 true 반환
async function duplicateLoginCheck(usn:number): Promise<boolean>{
    const ttl = await redis.ttl(`auth_token:${usn}`)
    console.log(ttl);
    if(ttl > 0){
        console.log(`중복 로그인 실행, 토큰 재설정 usn : ${usn}`);
        return true;
    }
    return false;
}

export const signUp = async (req: Request, res: Response) =>{
    const { loginType, loginId, loginPw, nick } = req.body;

    // 필요 파라미터 기재 여부 확인
    const requiredFields: Record<string, string> = {
        loginId: 'ID를 입력해주세요',
        loginPw: '비밀번호를 입력해주세요',
        nick: '닉네임을 입력해주세요',
    };

    for (const [key, msg] of Object.entries(requiredFields)) {
        if (!req.body[key]) {
            return res.status(400).json({ msg });
        }
    }

    try{
        const result = await authService.signUpService({loginType, loginId, loginPw, nick});

        if(result == 0){
            return res.status(200).json({message: '성공!'});
        }
    }catch(err: any){
        console.error('[회원가입 실패]', err);
        return res.status(err.status || 500).json({msg: err.message || '서버 오류 발생'});
    }
    

}

// TODO JWT 기능 추가
export const login = async (req: Request, res: Response) => {
    const { loginType, loginId, loginPw } = req.body;

    if (!loginId || !loginPw) {
        return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
    }

    try {
        const result = await authService.loginService({loginType, loginId, loginPw});

        const user = result;

        // Redis 토큰 생성 로직
        // const token = uuidv4();
        // if(await duplicateLoginCheck(user.usn)){
        //     console.log(`중복 로그인 확인. 기존 토큰 제거. usn : ${user.usn}`);
        //     // TODO 기존 로그인 클라에 로그아웃 패킷 송신 기능 추가

        //     await redis.del(`auth_token:${user.usn}`);
        // }
        // await redis.set(`auth_token:${user.usn}`, token, {
        //     EX: 1800 // 30분 후 만료
        // });

        // JWT 토큰 발급 및
        const token = signToken({usn: user.usn, nick: user.nick})

        return res
            .cookie('token', token, {
                httpOnly:true,
                sameSite: 'lax',
                secure: false,
                maxAge: 1000*60*60*24, // 1일
            })
            .status(200).json({
                message: '로그인 성공',
                token,
                usn: user.usn,
                nick: user.nick,
                rating: user.rating,
                money: user.money,
                free_cash: user.free_cash,
                real_cash: user.real_cash
                
        });

    } catch (err : any) {
        console.error('로그인 오류:', err);
        return res.status(err.status || 500).json({ message: err.message || '서버 오류' });
    }
};

export const getUserInfo = async (req: Request, res: Response) => {
    const usn = (req as any).user.usn;

    // 토큰 체크 중복으로 생략 가능
    // const token = verifyToken(req.cookies?.token)
    // if(usn != token.usn){
    //     return res.status(401).json({message: '토큰 비정상'})
    // }

    try{
        const result = await authService.getUserInfo(usn);

        return res
            // 토큰 체크 중복으로 생략
            // .cookie('token', token, {
            //     httpOnly:true,
            //     sameSite: 'lax',
            //     secure: false,
            //     maxAge: 1000*60*60*24, // 1일
            // }).
            .status(200).json({
                message: '로그인 성공',
                usn: result.usn,
                nick: result.nick,
                rating: result.rating,
                money: result.money,
                free_cash: result.free_cash,
                real_cash: result.real_cash
        });
    }catch(err : any){
        return res.status(401).json({message: err.message || '서버 오류'});
    }
}
