import { Router, Request, Response } from 'express';
import {getMySkins, getMySkinSettings, modifyMySkins, buy, cachingSkins, getAllSkins} from '../controller/skinController'
// import authMiddleware from '../../middlewares/auth';

const router = Router();

// router.post('/signup', signup);
router.get('/mySkins')
router.get('/mySkinSetting')
router.post('/mySkinSetting')
router.post('/buy')
router.post('/cache')
router.post('/all')

export default router;