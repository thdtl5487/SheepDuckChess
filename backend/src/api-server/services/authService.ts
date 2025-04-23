import * as authRepo from '../repository/authRepo';
import { SignupDTO, LoginDTO } from '../dto/auth.dto';
import bcrypt from 'bcrypt';

const bcryptSaltRounds = 10;

export const signUpService = async ({ loginType, loginId, loginPw, nick }: SignupDTO) : Promise<number>=>{
    const idExist = await authRepo.isLoginIdExist(loginId);
    if(idExist){
        throw{ status:400, message : '이미 존재하는 ID입니다 '};
    }

    const nickExist = await authRepo.isNicknameExist(nick);
    if(nickExist){
        throw{ status:400, message: '이미 존재하는 닉네임입니다' };
    }    

    const hashedPw = await bcrypt.hash(loginPw, bcryptSaltRounds);
    const usn = await authRepo.createAccount(loginType, loginId, hashedPw);
    await authRepo.createUser(usn, nick);
    return 0;
}

export const loginService = async ({ loginType, loginId, loginPw }: LoginDTO) : Promise<number> =>{

    const result = await authRepo.findUserByLoginIdAndLoginType(loginId, loginType);
    
    if(result == undefined){
        throw{ status:400, message : '존재하지 않는 아이디입니다' };
    }

    // const hashedPw = await bcrypt.hash(loginPw, bcryptSaltRounds);
    const isValidPw = await bcrypt.compare(loginPw, result.login_pw);

    if(!isValidPw){
        // TODO 텍스트 변경
        throw{ status:401, message : '비밀번호가 올바르지 않음' };
    }

    return result.usn;
}