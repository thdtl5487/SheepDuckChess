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