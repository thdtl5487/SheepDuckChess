import * as authRepo from '../repository/authRepo';
import { SignupDTO, LoginDTO, UserDTO } from '../dto/auth.dto';
import bcrypt from 'bcrypt';
import { ApiError } from '../../shared/utils/apiError';
import redis from '../../shared/config/redis';

const bcryptSaltRounds = 10;

export const signUpService = async ({ loginType, loginId, loginPw, nick }: SignupDTO) : Promise<number>=>{
    const idExist = await authRepo.isLoginIdExist(loginId);
    if(idExist){
        throw new ApiError(401, '이미 존재하는 ID입니다.');
    }

    const nickExist = await authRepo.isNicknameExist(nick);
    if(nickExist){
        throw new ApiError(401, '이미 존재하는 닉네임입니다.');
    }    

    const hashedPw = await bcrypt.hash(loginPw, bcryptSaltRounds);
    const usn = await authRepo.createAccount(loginType, loginId, hashedPw);
    await authRepo.createUser(usn, nick);
    return 0;
}

export const loginService = async ({ loginType, loginId, loginPw }: LoginDTO) : Promise<UserDTO> =>{

    const result = await authRepo.findUserByLoginIdAndLoginType(loginId, loginType);
    
    if(result == undefined){
        throw new ApiError(401, 'ID 또는 PW가 일치하지 않습니다.');
    }

    // const hashedPw = await bcrypt.hash(loginPw, bcryptSaltRounds);
    const isValidPw = await bcrypt.compare(loginPw, result.login_pw);

    if(!isValidPw){
        // TODO 텍스트 변경
        throw new ApiError(401, 'ID 또는 PW가 일치하지 않습니다..');
    }

    // 로그인 성공 ---

    // login date 갱신
    const loginLog = await authRepo.findLoginDates(result.usn);

    if(loginLog.first_login_date == null){
        const modifyLastLogin = await authRepo.modifyLoginDates(result.usn, true);
        if(!modifyLastLogin){
            
            throw new ApiError(500, '로그인 갱신에 실패했습니다.');
        }
    }

    const userInfo = await authRepo.findUserByUsn(result.usn);

    return userInfo;
}

export const getUserInfo = async (usn: number) : Promise<UserDTO> =>{

    const cached = await redis.get(`user:${usn}`)
    if(cached) return JSON.parse(cached);

    const user = await authRepo.findUserByUsn(usn);
    await redis.set(`user:${usn}`, JSON.stringify(user), {
        EX: 60, // ⏱ 60초 동안 캐시
    });
    
    return user;
}