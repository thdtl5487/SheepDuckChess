import { Request, Response } from 'express';
import pool from '../../shared/config/pool';
import redis from '../../shared/config/redis';
import { v4 as uuidv4 } from 'uuid';

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

export const login = async (req: Request, res: Response) => {
    const { loginId, loginPw } = req.body;

    if (!loginId || !loginPw) {
        return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
    }

    try {
        // 유저 조회
        // SQL 인젝션 방지를 위한 방식
        const result = await pool.query(
            'SELECT usn, login_pw FROM sdc_account_info WHERE login_id = $1',
            [loginId]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ message: '아이디 또는 비밀번호 불일치' });
        }

        const user = result.rows[0];

        // 비밀번호 비교 (암호화된 문자열 그대로 비교)
        if (user.login_pw !== loginPw) {
            return res.status(401).json({ message: '아이디 또는 비밀번호 불일치' });
        }

        // 토큰 생성 및 Redis 저장 (30분 유효)
        const token = uuidv4();
        if(await duplicateLoginCheck(user.usn)){
            console.log(`중복 로그인 확인. 기존 토큰 제거. usn : ${user.usn}`);
            // TODO 기존 로그인 클라에 로그아웃 패킷 송신 기능 추가

            await redis.del(`auth_token:${user.usn}`);
        }
        await redis.set(`auth_token:${user.usn}`, token, {
            EX: 1800 // 30분 후 만료
        });

        return res.status(200).json({
            message: '로그인 성공',
            token,
            usn: user.usn
        });

    } catch (err) {
        console.error('로그인 오류:', err);
        return res.status(500).json({ message: '서버 오류' });
    }
};
