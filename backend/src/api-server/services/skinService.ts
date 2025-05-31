import query from "../../shared/config/db";
import { QueryResult } from "pg";

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

export const modifyMySkins = async (usn: number, pawn: number, knight: number, bishop: number, rook: number, queen:number, king: number, board: number, character: number) => {

    const now = new Date().toISOString();
    
}

export const buy = async (usn: number, balanceMoney: number, balanceFreeCash: number, balanceRealCash: number) => {

    const now = new Date().toISOString();

}

export const selectAllSkinsCanBuy = async () =>{
    const result = await query(
        `SELECT skin_id, skin_type, rarity, price_money, price_cash, is_real_cash FROM sdc_skins WHERE is_active = true AND is_sell = true`
    )
    return result;
}

export const selectAllSkins = async () => {
    const result = await query(
        `SELECT skin_id, skin_type, rarity, price_money, price_cash, is_real_cash FROM sdc_skins`
    )
    return result;
}