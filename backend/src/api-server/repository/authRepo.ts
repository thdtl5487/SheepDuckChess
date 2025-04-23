import query from '../../shared/config/db';
import { QueryResult } from 'pg';

export const isLoginIdExist = async (loginId: string) => {
    const result = await query(
        'SELECT 1 FROM sdc_account_info WHERE login_id = $1', 
        [loginId]
    );
    return (result.rowCount ?? 0) > 0;
};

export const isNicknameExist = async (nick : string) => {
    const result = await query(
        'SELECT 1 FROM sdc_user WHERE nick = $1', [nick]
    );
    return (result.rowCount ?? 0) > 0;
}

export const createAccount = async(loginType:number, loginId: string, hashedPw: string) =>{
    const now = new Date().toISOString();
    const result = await query(
        `INSERT INTO sdc_account_info (login_type, login_id, login_pw, sign_date, regdate) VALUES ($1, $2, $3, $4, $4) RETURNING usn`,
        [loginType, loginId, hashedPw, now]
    );

    return result.rows[0].usn;
};

export const createUser = async(usn: number, nick: string) =>{
    const now = new Date().toISOString();
    const result = await query(
        `INSERT INTO sdc_user (usn, nick, regdate) VALUES ($1, $2, $3)`,
        [usn, nick, now]
    );

    return (result.rowCount ?? 0) > 0;
}

export const findUserByLoginIdAndLoginType = async(loginId: string, loginType: number) =>{
    const result = await query(
        `SELECT usn, login_pw FROM sdc_account_info WHERE login_id = $1 AND login_type = $2`, [loginId, loginType]
    );
    return result.rows[0];
}

export const findLoginDates = async(usn:number)=>{
    const result = await query(
        `SELECT usn, first_login_date, last_login_date FROM sdc_account_info WHERE usn = $1`, [usn]
    );
    return result.rows[0];
}

export const modifyLoginDates = async(usn:number, isFirst:boolean)=>{
    const now = new Date().toISOString();
    let result;
    if(isFirst){
        result = await query(`UPDATE sdc_account_info SET first_login_date = $2, last_login_date = $2 WHERE usn = $1`, [usn, now])
    }else{
        result = await query(`UPDATE sdc_account_info SET last_login_date = $2 WHERE usn = $1`, [usn, now])
    }
    return (result.rowCount ?? 0)> 0;
}