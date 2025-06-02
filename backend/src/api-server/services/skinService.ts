import redis from "../../shared/config/redis"
import { ApiError } from "../../shared/utils/apiError";
import * as skinRepo from '../repository/skinRepo'

export const getMySkins = async (usn: number) => {

    const saved = await redis.get(`userSkin:${usn}`);
    if (!saved) {
        const dbResult = await skinRepo.selectMySkin(usn)
        if (!dbResult) {
            throw new ApiError(500, '내 스킨 정보를 찾을 수 없습니다.');
        } else {
            const skinIds = dbResult.rows.map(row => row.skin_id);
            await redis.set(`userSkin:${usn}`, JSON.stringify(skinIds))
            return skinIds;
        }
    }
}

export const getMySkinSettings = async (usn: number) => {

    const dbResult = await skinRepo.selectMySkinSetting(usn);
    if (!dbResult) {
        throw new ApiError(500, '내 스킨 장착 정보를 찾을 수 없습니다.');
    } else {
        const skinSettings = dbResult.rows[0];
        return skinSettings;
    }
}

export const modifyMySkin = async (usn: number, pawn: number, knight: number, rook: number, bishop: number, queen: number, king: number, board: number, character: number) => {
    // 1. 부위-스킨ID 맵 만들기
    const partMap = {
        pawn,
        knight,
        bishop,
        rook,
        queen,
        king,
        board,
        character,
    };

    // 2. 각 부위/스킨ID 한 번에 검증
    for (const [part, skinId] of Object.entries(partMap)) {
        await validateSkin(part, skinId);
    }

    // 3. 검증 통과 후 DB 업데이트
    const dbResult = await skinRepo.modifyMySkins(usn, pawn, knight, bishop, rook, queen, king, board, character);
    if (dbResult != 1) {
        throw new ApiError(500, '스킨 장착 정보 교체 실패');
    }
    return dbResult;
}

async function validateSkin(type: string, skinId: number) {
    if (!skinId) throw new ApiError(400, `스킨 ID 누락: ${type}`);
    const redisVal = await redis.get(`skin:${skinId}`);
    if (!redisVal) throw new ApiError(400, `존재하지 않는 스킨: ${skinId}`);
    const skinInfo = JSON.parse(String(redisVal));
    if (skinInfo.skin_type !== type) {
        throw new ApiError(400, `${skinId}는 ${type} 부위에 장착 불가`);
    }
}

export const cachingAllSkin = async () => {

    const allSkin = (await skinRepo.selectAllSkins()).rows;
    for (const skin of allSkin) {
        await redis.set(`skin:${skin.skin_id}`, JSON.stringify(skin));
    }

}