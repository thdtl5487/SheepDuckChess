import query from '../../shared/config/db';
import { QueryResult } from 'pg';

export const insertGameLogs = async(game_serial_number:string, white_player:number, black_player:number, win:string, game_log:string[]) => {
    const now = new Date().toISOString();
    // 무승부 0 / 백 승 : 1 / 흑 승 : 2
    const winInt = win === 'draw' ? 0 : win === 'white_win' ? 1 : 2

    const jsonLog = JSON.stringify(game_log);

    const result = await query(
        `INSERT INTO sdc_game_log (game_serial_number, white_player, black_player, win, game_log, game_date) VALUES ($1, $2, $3, $4, $5, $6) `,
        [game_serial_number, white_player, black_player, winInt, jsonLog, now]
    );

    console.log(result);

    return result;

}