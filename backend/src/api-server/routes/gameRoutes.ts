import { Router } from 'express';
import { createGame, insertLogs } from '../controller/gameController';

const gameRoutes = Router();

gameRoutes.post('/createGame', createGame);
gameRoutes.post('/insertLogs', insertLogs);
export default gameRoutes;
