import * as authRepo from '../repository/authRepo';
import { SignupDTO } from '../dto/auth.dto';
import bcrypt from 'bcrypt';

export const signUp = async ({ loginType, loginId, loginPw, nick }: SignupDTO) : Promise<void>=>{
    const idExist = await authRepo.isLoginIdExist(loginId);
    if(idExist){
        throw{ status:400, message : '이미 존재하는 ID입니다 '};
    }

    const nickExist = await authRepo.isNicknameExist(nick);
    if(nickExist){
        throw{ status:400, message: '이미 존재하는 닉네임입니다' };
    }    

    const hashedPw = await bcrypt.hash(loginPw, 10);
    const usn = await authRepo.createAccount(loginType, loginId, hashedPw);
    await authRepo.createUser(usn, nick);
}