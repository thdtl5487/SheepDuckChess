import { Router } from 'express';
import { createGame } from '../controller/gameController';

const gameRoutes = Router();

gameRoutes.post('/createGame', createGame);

export default gameRoutes;
