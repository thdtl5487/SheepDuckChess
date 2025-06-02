import { Request, Response } from 'express';
import * as skinService from '../services/skinService'
import { verifyToken, getToken, getPayload } from '../../shared/utils/jwt';

// 내 보유 스킨들
// /skin/mySkins
export const getMySkins = async (req: Request, res: Response) => {
    const token = getToken(req);
    const payload = getPayload(token);
    const usn = payload.usn;

    const result = await skinService.getMySkins(usn);

    if (!result) {
        console.log(`usn : ${usn} 스킨 정보 불러오기 실패`);
        return res.status(500).json({ message: '스킨 정보 불러오기 실패' });
    }
    return res.status(200).json({ skin_ids: result });
}

// 장착중인 스킨
// /skin/mySkinSetting (get)
export const getMySkinSettings = async (req: Request, res: Response) => {
    const token = getToken(req);
    const payload = getPayload(token);
    const usn = payload.usn;
    const result = await skinService.getMySkinSettings(usn);

    if (!result) {
        console.log(`usn : ${usn} 스킨 장착 정보 불러오기 실패`);
        return res.status(500).json({ message: '스킨 장착 정보 불러오기 실패' });
    }
    return res.status(200).json({ skinSetting: result });
}

// 장착 변경
// /skin/changeSkinSetting (post)
export const modifyMySkins = async (req: Request, res: Response) => {
    const token = getToken(req);
    const payload = getPayload(token);
    const usn = payload.usn;
    const {pawn, knight, rook, bishop, queen, king, board, character} = req.body;
    try{
        const dbResult = await skinService.modifyMySkin(usn, pawn, knight, rook, bishop, queen, king, board, character);
        return res.status(200).json({message: 'success'});
    }catch(err : any){
        return res.status(err.statusCode).json({message: err.message || '서버오류'});
    }
    
}

// 구매
// /skin/buy (post)
export const buy = async (req: Request, res: Response) => {

}

// 전체 스킨목록 조회
// /skin/all (post)
export const getAllSkins = async (req: Request, res: Response) => {
    
}

// 구매 가능 스킨만 조회
export const getAllSkinsToBuy = async (req:Request, res: Response)=> {
    console.log('hi');
    console.log('hihi')
}

// ------------GM용---------------
// 전체 스킨 캐싱 (GM툴)

// /skin/cache (post)
export const cachingSkins = async (req: Request, res: Response) => {
    skinService.cachingAllSkin();
}