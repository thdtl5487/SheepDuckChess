import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../types/user";
import ChessBoard from "../components/game/ChessBoard";
import PlayerPanel from "../components/game/PlayerPanel";
import GameLog from "../components/game/GameLog";
import OverlayEffects from "../components/game/OverlayEffects";

const GamePage = () => {
    const { gameId } = useParams();
    const user = useRecoilValue(userAtom);

    useEffect(() => {
        // TODO: WebSocket(game-server) 연결 및 ENTER_GAME 메시지 전송
        // TODO: onmessage 핸들링: TURN_MOVE, GAME_OVER, etc.
    }, [gameId]);

    return (
        <div className="relative w-full h-screen flex flex-col bg-gray-900 text-white">
            {/* 상단: 상대 플레이어 패널 */}
            <PlayerPanel side="opponent" />

            {/* 중앙: 체스판 + 연출 */}
            <div className="relative flex-1 flex items-center justify-center">
                <ChessBoard isFlipped={true} />
                <OverlayEffects />
            </div>

            {/* 하단: 내 플레이어 패널 + 로그 */}
            <div className="flex flex-col md:flex-row w-full border-t border-gray-700">
                <PlayerPanel side="you" />
                <GameLog />
            </div>
        </div>
    );
};

export default GamePage;
