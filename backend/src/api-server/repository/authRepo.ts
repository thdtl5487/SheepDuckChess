import query from '../../shared/config/db';
import { QueryResult } from 'pg';

export const isLoginIdExist = async (loginId: string) => {
    const result = await query(
        'SELECT 1 FROM sdc_account_info WHERE login_id = $1',
        [loginId]
    );
    return (result.rowCount ?? 0) > 0;
};

export const isNicknameExist = async (nick: string) => {
    const result = await query(
        'SELECT 1 FROM sdc_user WHERE nick = $1', [nick]
    );
    return (result.rowCount ?? 0) > 0;
}

export const createAccount = async (loginType: number, loginId: string, hashedPw: string) => {
    const now = new Date().toISOString();
    const result = await query(
        `INSERT INTO sdc_account_info (login_type, login_id, login_pw, sign_date, regdate) VALUES ($1, $2, $3, $4, $4) RETURNING usn`,
        [loginType, loginId, hashedPw, now]
    );

    return result.rows[0].usn;
};

export const createUser = async (usn: number, nick: string) => {
    const now = new Date().toISOString();
    const result = await query(
        `INSERT INTO sdc_user (usn, nick, regdate) VALUES ($1, $2, $3)`,
        [usn, nick, now]
    );

    return (result.rowCount ?? 0) > 0;
}

export const findUserByLoginIdAndLoginType = async (loginId: string, loginType: number) => {
    const result = await query(
        `SELECT usn, login_pw FROM sdc_account_info WHERE login_id = $1 AND login_type = $2`, [loginId, loginType]
    );
    return result.rows[0];
}

export const findLoginDates = async (usn: number) => {
    const result = await query(
        `SELECT usn, first_login_date, last_login_date FROM sdc_account_info WHERE usn = $1`, [usn]
    );
    return result.rows[0];
}

export const modifyLoginDates = async (usn: number, isFirst: boolean) => {
    const now = new Date().toISOString();
    let result;
    if (isFirst) {
        result = await query(`UPDATE sdc_account_info SET first_login_date = $2, last_login_date = $2 WHERE usn = $1`, [usn, now])
    } else {
        result = await query(`UPDATE sdc_account_info SET last_login_date = $2 WHERE usn = $1`, [usn, now])
    }
    return (result.rowCount ?? 0) > 0;
}

export const findUserByUsn = async (usn: number) => {
    let result = await query(
        `SELECT usn, nick, grade, rating, money, free_cash, real_cash FROM sdc_user WHERE usn = $1`, [usn]
    )
    return result.rows[0];
}

export const findUserSkinInfoByUsn = async (usn: number) => {
    let result = await query(
        `SELECT usn, piece_skin_pawn, piece_skin_knight, piece_skin_bishop, piece_skin_rook, piece_skin_queen, piece_skin_king, board_skin, character_id
        from sdc_user_skin_setting WHERE usn = $1`, [usn]
    )
    return result.rows[0];
}

// firstTeam : true면 양, false면 오리
export const insertUserSkinSettingInfo = async (usn: number, firstTeam: boolean) => {
    let skinValues: number[];

    if (firstTeam) {
        skinValues = [2, 4, 6, 8, 10, 12, 13, 16];
    } else {
        skinValues = [1, 3, 5, 7, 9, 11, 14, 15];
    }

    const result = await query(
        `INSERT INTO sdc_user_skin_setting 
      (usn, piece_skin_pawn, piece_skin_knight, piece_skin_bishop, piece_skin_rook, piece_skin_queen, piece_skin_king, board_skin, character_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [usn, ...skinValues]
    );

    return (result.rowCount ?? 0) > 0;
};

/**
 * 유저 가입 시 기본 스킨 16개 지급
 * @param usn 유저 식별자
 */
export const insertDefaultSkinsForUser = async (usn: number) => {
    const now = new Date().toISOString();

    const values = Array.from({ length: 16 }, (_, idx) => `(${usn}, ${idx + 1}, '${now}')`).join(',');

    const sql = `
        INSERT INTO sdc_user_skins (usn, skin_id, regdate)
        VALUES ${values}
    `;

    const result = await query(sql);

    console.log(`[스킨] 기본 스킨 16개 유저 ${usn}에게 지급 완료`);

    return (result.rowCount ?? 0) > 0;
};