import * as gameRepo from '../repository/gameRepo';
import { GameLogDTO } from '../dto/game.dto';

export const insertGameLogsService = async({ game_serial_number, white_player, black_player, win, game_log }: GameLogDTO) : Promise<void>=>{

    gameRepo.insertGameLogs(game_serial_number, white_player, black_player, win, game_log);

}