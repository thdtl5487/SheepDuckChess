import { Request, Response } from 'express';
import { insertGameLogsService } from '../services/gameService';

export const createGame = (req: Request, res: Response) => {
    const { gameId, player1, player2 } = req.body;

    if (!gameId || !player1 || !player2) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`🎮 [api-server] Game created: ${gameId}`);
    console.log(`  ↪ Player 1: ${player1.nick} (${player1.rating})`);
    console.log(`  ↪ Player 2: ${player2.nick} (${player2.rating})`);

    // TODO: 추후 DB에 저장하거나 game-server로 전달

    return res.status(201).json({ ok: true });
};

export const insertLogs = (req: Request, res: Response) => {

    console.log("insertLog start");
    // console.log(res);
    const { game_serial_number, white_player, black_player, win, game_log, game_date } = req.body;
    
    if(!game_serial_number || !white_player || !black_player || !win || !game_log || !game_date){
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log("game_serial_number : ", game_serial_number);
    console.log("whitePlayer : ", white_player);
    console.log("black_player : ", black_player);
    console.log("win : ", win);
    console.log("game_log", game_log);
    
    insertGameLogsService({game_serial_number, white_player, black_player, win, game_log});

    return res.status(201).json({ok: true});
}
