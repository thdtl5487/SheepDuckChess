import { Request, Response } from 'express';
import pool from '../../shared/config/pool';
import redis from '../../shared/config/redis';
import { v4 as uuidv4 } from 'uuid';

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
