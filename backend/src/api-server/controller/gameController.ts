import { Request, Response } from 'express';

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
