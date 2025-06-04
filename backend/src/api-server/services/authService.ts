import * as authRepo from '../repository/authRepo';
import { SignupDTO, LoginDTO, UserDTO, UserSkinInfoDTO } from '../dto/auth.dto';
import bcrypt from 'bcrypt';
import { ApiError } from '../../shared/utils/apiError';
import redis from '../../shared/config/redis';
import { getPayload, getToken, signRefreshToken, signToken } from '../../shared/utils/jwt';
import { Request, Response } from 'express';

const bcryptSaltRounds = 10;

export const signUpService = async ({ loginType, loginId, loginPw, nick, firstTeam }: SignupDTO): Promise<number> => {
    const idExist = await authRepo.isLoginIdExist(loginId);
    if (idExist) {
        throw new ApiError(401, '이미 존재하는 ID입니다.');
    }

    const nickExist = await authRepo.isNicknameExist(nick);
    if (nickExist) {
        throw new ApiError(401, '이미 존재하는 닉네임입니다.');
    }

    const hashedPw = await bcrypt.hash(loginPw, bcryptSaltRounds);
    const usn = await authRepo.createAccount(loginType, loginId, hashedPw);
    await authRepo.createUser(usn, nick);

    if (!usn) {
        throw new ApiError(500, '계정 생성 중 오류 발생');
    }

    authRepo.insertDefaultSkinsForUser(usn);
    authRepo.insertUserSkinSettingInfo(usn, firstTeam);

    return 0;
}

export const loginService = async ({ loginType, loginId, loginPw }: LoginDTO) => {

    const result = await authRepo.findUserByLoginIdAndLoginType(loginId, loginType);

    if (result == undefined) {
        throw new ApiError(401, 'ID 또는 PW가 일치하지 않습니다.');
    }

    // const hashedPw = await bcrypt.hash(loginPw, bcryptSaltRounds);
    const isValidPw = await bcrypt.compare(loginPw, result.login_pw);

    if (!isValidPw) {
        // TODO 텍스트 변경
        throw new ApiError(401, 'ID 또는 PW가 일치하지 않습니다..');
    }

    // 로그인 성공 ---

    // login date 갱신
    const loginLog = await authRepo.findLoginDates(result.usn);

    if (loginLog.first_login_date == null) {
        const modifyLastLogin = await authRepo.modifyLoginDates(result.usn, true);
        if (!modifyLastLogin) {

            throw new ApiError(500, '로그인 갱신에 실패했습니다.');
        }
    }

    const accessToken = signToken(result.usn);
    const refreshToken = signRefreshToken(result.usn);

    await redis.set(`refresh:${result.usn}`, refreshToken, { EX: 60 * 60 * 24 * 7 });

    const userInfo = await authRepo.findUserByUsn(result.usn);

    return {
        userInfo,
        tokens: {
            accessToken,
            refreshToken
        }
    };
}

export const getUserInfoService = async (usn: number): Promise<UserDTO> => {

    const cached = await redis.get(`user:${usn}`)
    if (cached) return JSON.parse(cached);

    const user = await authRepo.findUserByUsn(usn);
    await redis.set(`user:${usn}`, JSON.stringify(user), {
        EX: 60, // ⏱ 60초 동안 캐시
    });

    return user;
}

export const getUserSkinSettingInfo = async (usn: number): Promise<UserSkinInfoDTO> => {

    const result = await authRepo.findUserSkinInfoByUsn(usn);
    if (result == undefined) {
        throw new ApiError(500, '유저 스킨 정보를 찾을 수 없습니다.');
    }

    return result;
}

// 유저 최초 가입 시 생성되는 기본 세팅값
// firstTeam (오리, 양 중 최초선택)
export const createDefaultUserSkinInfo = async (usn: number, firstTeam: boolean) => {

    const result = await authRepo.insertUserSkinSettingInfo(usn, false);

    return result;
}

export const getUsn = (req: Request) => {
    try {
        const token = getToken(req);
        const payload = getPayload(token);
        const usn = payload.usn;
        return usn;

    } catch (e: any) {
        console.log('jwt ERROR !!! : ',e);
        throw new ApiError(400, '토큰 정보 불러오기 실패');
    }
}