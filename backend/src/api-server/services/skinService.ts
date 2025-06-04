import pool from "../../shared/config/pool";
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

export const getProductService = async () => {
    // 모든 스킨 키 조회
    let keys = await redis.keys('skin:*');
    if (!keys.length) {
        await cachingAllSkin();
        keys = await redis.keys('skin:*');
    };

    // 스킨 데이터 한 번에 가져오기
    try {
        const arrSkinData = await redis.mGet(keys);
        return arrSkinData;
    } catch (err: any) {
        throw new ApiError(500, '스킨 캐싱 에러');
    }

}


export const buyProduct = async (usn: number, productId: number, buyType: string) => {
    // 스킨 마스터 정보
    const skinRaw = await redis.get(`skin:${productId}`);
    if (!skinRaw) throw new ApiError(404, '존재하지 않는 상품');
    const skin = JSON.parse(skinRaw);

    // 이미 보유 여부 체크
    const ownedSkins = await skinRepo.getUserOwnedSkinIds(usn);
    if (ownedSkins.includes(productId)) throw new ApiError(400, '이미 보유 중인 아이템');

    // 유저 잔액 조회
    const user = await skinRepo.getUserBalances(usn);
    let { money, free_cash, real_cash } = user;

    switch (buyType) {
        case 'money':
            if (skin.price_money <= 0) throw new ApiError(400, '이 상품은 money로 구매 불가');
            if (money < skin.price_money) throw new ApiError(400, '머니 부족');
            money -= skin.price_money;
            break;

        case 'real_cash':
            if (skin.is_real_cash !== true) throw new ApiError(400, 'real_cash 구매 불가 상품');
            if (real_cash < skin.price_cash) throw new ApiError(400, '유료캐시 부족');
            real_cash -= skin.price_cash;
            break;

        case 'cash':
            if (skin.is_real_cash === true) throw new ApiError(400, '무료캐시로 구매 불가');
            if (skin.price_cash <= 0) throw new ApiError(400, '이 상품은 cash로 구매 불가');
            if (free_cash + real_cash < skin.price_cash) throw new ApiError(400, '캐시/유료캐시 합계 부족');
            // 무료캐시 우선 소진
            let needed = skin.price_cash;
            let useCash = Math.min(free_cash, needed);
            needed -= useCash;
            free_cash -= useCash;
            real_cash -= needed; // needed가 0이면 변화 없음, 남으면 real_cash 차감
            break;

        default:
            throw new ApiError(400, '비정상적인 구매 타입');
    }

    // 차감/지급 트랜잭션
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await skinRepo.updateUserBalances(usn, money, free_cash, real_cash);
        await skinRepo.addSkinToUser(usn, productId);
        await client.query('COMMIT');
    }catch(err: any){
        await client.query('ROLLBACK');
        client.release();
        throw new ApiError(500, '트랜잭션 에러');
    }
    client.release();
    // 트랜잭션 종료


    // 새로 삽입 후 DB에서 보유스킨을 다시 읽어서 최신화
    const updatedSkins = await skinRepo.getUserOwnedSkinIds(usn);
    await redis.set(`userSkin:${usn}`, JSON.stringify(updatedSkins));

    return { skinId: productId, buyType, newBalance: { money, cash: free_cash, real_cash } };
};

