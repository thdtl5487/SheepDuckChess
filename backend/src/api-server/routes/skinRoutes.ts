import { Router, Request, Response } from 'express';
import {getMySkins, getMySkinSettings, modifyMySkins, buy, cachingSkins, getAllSkins, getAllSkinsToBuy} from '../controller/skinController'
// import authMiddleware from '../../middlewares/auth';

const skinRoutes = Router();

// router.post('/signup', signup);
skinRoutes.get('/mySkins', getMySkins)
skinRoutes.get('/mySkinSetting', getMySkinSettings)
skinRoutes.post('/changeSkinSetting', modifyMySkins)
skinRoutes.post('/buy', buy)
skinRoutes.post('/cache', cachingSkins)
skinRoutes.post('/all', getAllSkins)
skinRoutes.post('/allSkin', getAllSkinsToBuy)

export default skinRoutes;