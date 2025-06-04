import { Request, Response } from 'express';
import * as skinService from '../services/skinService'
import { getUsn } from '../services/authService';

// 내 보유 스킨들
// /skin/mySkins
export const getMySkins = async (req: Request, res: Response) => {
    try {
        const usn = getUsn(req);
        const result = await skinService.getMySkins(usn);
        return res.status(200).json({ skin_ids: result });
    } catch (err: any) {
        return res.status(err.statusCode).json({ message: err.message || '서버오류' });
    }
}

// 장착중인 스킨
// /skin/mySkinSetting (get)
export const getMySkinSettings = async (req: Request, res: Response) => {
    try {
        const usn = getUsn(req);
        const result = await skinService.getMySkinSettings(usn);
        return res.status(200).json({ skinSetting: result });

    } catch (err: any) {
        return res.status(err.statusCode).json({ message: err.message || '서버오류' });
    }

}

// 장착 변경
// /skin/changeSkinSetting (post)
export const modifyMySkins = async (req: Request, res: Response) => {
    try {
        const usn = getUsn(req);
        const { pawn, knight, rook, bishop, queen, king, board, character } = req.body;
        const dbResult = await skinService.modifyMySkin(usn, pawn, knight, rook, bishop, queen, king, board, character);
        return res.status(200).json({ message: 'success' });
    } catch (err: any) {
        return res.status(err.statusCode).json({ message: err.message || '서버오류' });
    }

}

// 구매
// /skin/buy (post)
export const buy = async (req: Request, res: Response) => {
    try {
        const usn = getUsn(req);
        const { buyType, productId } = req.body;
        const buyResult = await skinService.buyProduct(usn, productId, buyType)
        return res.status(200).json({ result: buyResult });
    } catch (err: any) {
        res.status(err.status || 500).json({ message: err.message || '구매 박살남' });
    }


}

// 전체 스킨목록 조회
// /skin/all (post)
export const getAllSkins = async (req: Request, res: Response) => {

}

// 구매 가능 스킨만 조회
// /skin/getProduct
export const getAllSkinsToBuy = async (req: Request, res: Response) => {
    try {
        const usn = getUsn(req);
        const skinData = await skinService.getProductService();
        return res.status(200).json({ data: skinData });
    } catch (e: any) {
        return res.status(e.statusCode).json({ message: e.message || '토큰에러' });
    }
}

// ------------GM용---------------
// 전체 스킨 캐싱 (GM툴)

// /skin/cache (post)
export const cachingSkins = async (req: Request, res: Response) => {
    skinService.cachingAllSkin();
    return res.status(200);
}