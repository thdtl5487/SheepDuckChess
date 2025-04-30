import { Request, Response } from 'express';
import pool from '../../shared/config/pool';
import redis from '../../shared/config/redis';
import { v4 as uuidv4 } from 'uuid';
import * as authService from '../services/authService';
import { signToken, verifyRefreshToken, verifyToken } from '../../shared/utils/jwt';
import { verify } from 'crypto';
import { setCookie } from '../../shared/utils/cookie';

// 중복 로그인 확인용, 중복 로그인 확인 시 true 반환
async function duplicateLoginCheck(usn: number): Promise<boolean> {
    const ttl = await redis.ttl(`auth_token:${usn}`)
    if (ttl > 0) {
        console.log(`중복 로그인 실행, 토큰 재설정 usn : ${usn}`);
        return true;
    }
    return false;
}

export const signUp = async (req: Request, res: Response) => {
    const { loginType, loginId, loginPw, nick, firstTeam } = req.body;

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

    try {
        const result = await authService.signUpService({ loginType, loginId, loginPw, nick, firstTeam });

        if (result == 0) {
            return res.status(200).json({ message: '성공!' });
        }
    } catch (err: any) {
        console.error('[회원가입 실패]', err);
        return res.status(err.status || 500).json({ msg: err.message || '서버 오류 발생' });
    }
}

export const login = async (req: Request, res: Response) => {
    const { loginType, loginId, loginPw } = req.body;

    if (!loginId || !loginPw) {
        return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
    }

    try {
        const result = (await authService.loginService({ loginType, loginId, loginPw }));
        
        const { accessToken, refreshToken } = result.tokens;
        const user = result.userInfo;
        const userSkinInfo = await authService.getUserSkinSettingInfo(user.usn);
        const token = signToken(user.usn);

        setCookie(res, 'token', token, 1000 * 60 * 15);
        setCookie(res, 'refreshToken', refreshToken, 1000 * 60 * 60 * 24 * 7);

        return res
            .status(200).json({
                message: '로그인 성공',
                token,
                usn: user.usn,
                nick: user.nick,
                rating: user.rating,
                money: user.money,
                free_cash: user.free_cash,
                real_cash: user.real_cash,
                "pieceSkin": {
                    "pawn": userSkinInfo.piece_skin_pawn,
                    "knight": userSkinInfo.piece_skin_knight,
                    "bishop": userSkinInfo.piece_skin_bishop,
                    "rook": userSkinInfo.piece_skin_rook,
                    "queen": userSkinInfo.piece_skin_queen,
                    "king": userSkinInfo.piece_skin_king,
                },
                "boardSkin": userSkinInfo.board_skin,
                "character": userSkinInfo.character_id
            });

    } catch (err: any) {
        console.error('로그인 오류:', err);
        return res.status(err.status || 500).json({ message: err.message || '서버 오류' });
    }
};

// /api/me
export const getUserInfo = async (req: Request, res: Response) => {
    const usn = (req as any).user.usn;

    try {
        const result = await authService.getUserInfoService(usn);

        return res
            .status(200).json({
                message: '로그인 성공',
                usn: result.usn,
                nick: result.nick,
                rating: result.rating,
                money: result.money,
                free_cash: result.free_cash,
                real_cash: result.real_cash
            });
    } catch (err: any) {
        return res.status(401).json({ message: err.message || '서버 오류' });
    }
}

export const getUserInfoByRFToken = async (req: Request, res: Response) => {

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: '111 리프레시 토큰이 만료되거나 없음' });
    try {
        const payload = verifyRefreshToken(refreshToken);
        const usn = payload.usn;

        const result = await authService.getUserInfoService(usn);
        return res.status(200).json({
            usn: result.usn,
            nick: result.nick,
            rating: result.rating,
            money: result.money,
            free_cash: result.free_cash,
            real_cash: result.real_cash
        })
    } catch (err: any) {
        return res.status(401).json({ message: err.message || '서버 오류' });
    }
}

export const refreshAccessToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: '리프레시 토큰 만료되거나 없음' });

    try {
        const payload = verifyRefreshToken(refreshToken);
        const usn = payload.usn;

        const saved = await redis.get(`refresh:${usn}`);
        if (!saved || saved !== refreshToken) {
            return res.status(401).json({ message: '토큰 변조 가능성 감지' })
        }

        const newAccessToken = signToken(usn);
        setCookie(res, 'token', newAccessToken, 1000 * 60 * 15);

        return res.status(200).json({ message: '토큰 갱신 완료' });

    } catch (err) {
        return res.status(401).json({ message: '리프레시 토큰 유효하지 않음' })
    }
}