import query from "../../shared/config/db";
import { QueryResult } from "pg";
import { ApiError } from "../../shared/utils/apiError";

export const selectMySkin = async (usn: number) => {
    const result = await query(
        `SELECT skin_id FROM sdc_user_skins WHERE usn = $1`, [usn]
    )

    return result;
}

export const selectMySkinSetting = async (usn: number) => {
    const result = await query(
        `SELECT usn, piece_skin_pawn, piece_skin_knight, piece_skin_bishop, piece_skin_rook, piece_skin_queen, piece_skin_king, board_skin, character_id
        from sdc_user_skin_setting WHERE usn = $1`, [usn]
    )
    return result.rows[0]
}

export const modifyMySkins = async (usn: number, pawn: number, knight: number, bishop: number, rook: number, queen: number, king: number, board: number, character: number) => {

    const now = new Date().toISOString();
    const result = await query(
        `UPDATE sdc_user_skin_setting
            SET
                piece_skin_pawn = $1,
                piece_skin_knight = $2,
                piece_skin_bishop = $3,
                piece_skin_rook = $4,
                piece_skin_queen = $5,
                piece_skin_king = $6,
                board_skin = $7,
                character_id = $8,
                regdate = $9
            WHERE usn = $10`, [pawn, knight, bishop, rook, queen, king, board, character, now, usn]
    )
    // console.log("update Result : ", result);
    return result.rowCount;
}

export const selectAllSkinsCanBuy = async () => {
    const result = await query(
        `SELECT skin_id, skin_type, rarity, price_money, price_cash, is_real_cash FROM sdc_skins WHERE is_active = true AND is_sell = true`
    )
    return result;
}

export const selectAllSkins = async () => {
    const result = await query(
        `SELECT skin_id, skin_type, rarity, price_money, price_cash, is_real_cash, is_active, is_sell FROM sdc_skins`
    )
    return result;
}

// 구매용 쿼리 ----------------------------

// 해당 유저의 보유 스킨 ID 조회
export const getUserOwnedSkinIds = async (usn: number) => {
    const result = await query('SELECT skin_id FROM sdc_user_skins WHERE usn = $1', [usn]);
    return result.rows.map(r => r.skin_id); // [3, 7, 8, ...]
};

// 유저 잔액 조회
export const getUserBalances = async (usn: number) => {
    const result = await query('SELECT money, free_cash, real_cash FROM sdc_user WHERE usn = $1', [usn]);
    if (!result.rows.length) throw new ApiError(404, '유저 정보 없음');
    return result.rows[0];
};

// 잔액 차감
export const updateUserBalances = async (usn: number, newMoney: number, newCash: number, newRealCash: number) => {
    await query(
        'UPDATE sdc_user SET money = $1, free_cash = $2, real_cash = $3 WHERE usn = $4',
        [newMoney, newCash, newRealCash, usn]
    );
};

// 유저에게 스킨 지급
export const addSkinToUser = async (usn: number, skinId: number) => {
    await query('INSERT INTO sdc_user_skins (usn, skin_id) VALUES ($1, $2)', [usn, skinId]);
};
