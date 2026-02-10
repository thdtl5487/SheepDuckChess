import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { userState } from "../store/userState";
import { ReactElement } from "react";
import LogoutButton from "../components/btn_logout";
import { api } from "../utills/api";
import { useMatchSocket } from "../hooks/inGame/useMatchSocket";
import MatchOverlay from "../components/MatchOverlay";
import { useSetRecoilState } from "recoil";
import { matchInfoAtom } from "../types/matchInfo";

const MainPage = (): ReactElement | null => {
    const [user, setUser] = useRecoilState(userState);
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false); // 로딩 체크용 상태 추가
    const [matchingStarted, setMatchingStarted] = useState(false);
    const [triggerQueue, setTriggerQueue] = useState(false);
    const [matchedInfo, setMatchedInfo] = useState<any | null>(null);
    const [timeMinutes, setTimeMinutes] = useState<number>(10); // 기본 10분

    const handleMatchStart = () => {
        setMatchingStarted(true);
    };

    const setMatchInfo = useSetRecoilState(matchInfoAtom);

    const socketRef = useMatchSocket(user!, triggerQueue, (payload) => {
        setMatchedInfo(payload);
        setMatchInfo({
            gameId: payload.gameId,
            yourColor: payload.yourColor,
            opponentNick: payload.opponentNick,
            userSkinSetting: payload.userSkinSetting,
            opponentSkinSetting: payload.opponentSkinSetting,
        });
    }, { timeMinutes });

    const handleCancelMatch = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "LEAVE_QUEUE",
                usn: user!.usn,
            }));
        }
        setMatchingStarted(false);
        setMatchedInfo(null);
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!user) {
                    const res = await api.post("/api/getUserInfoByRFToken", {}, { withCredentials: true });
                    setUser(res.data);
                }
            } catch (err: any) {
                console.log("자동 로그인 실패 → 로그인 페이지로", err.response?.status, err.response?.data || err.message);
                navigate("/login");
            }
        };

        fetchUser();
        setChecked(true);
    }, [user, setUser, navigate]);

    if (!checked) return <div>로딩중</div>;
    if (!user) return <div>유저가없음</div>;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 relative">
            {matchingStarted && (
                <>
                    <MatchOverlay
                        opponentNick={matchedInfo?.opponentNick}
                        yourColor={matchedInfo?.yourColor}
                        onEnterQueue={() => setTriggerQueue(true)}
                        onFinished={() => {
                            localStorage.setItem('matchInfo', JSON.stringify(matchedInfo));
                            // localStorage.setItem('ongoingGameId', matchedInfo.gameId);
                            navigate(`/game/${matchedInfo?.gameId}`)
                        }}
                    />
                    <button
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 z-50"
                        onClick={handleCancelMatch}
                    >
                        매칭 취소
                    </button>
                </>
            )}
            <h1 className="text-3xl font-bold mb-6">🐑 Welcome SheepDuckChess 🦆</h1>
            <h1 className="text-3xl font-bold mb-6">🐑 {user.nick} 🦆</h1>
            <div className="flex items-center gap-3 mb-6">
                <div className="text-sm text-gray-700">게임 시간</div>
                <div className="flex items-center gap-2">
                    {[3, 10, 30].map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setTimeMinutes(m)}
                            className={
                                timeMinutes === m
                                    ? "px-3 py-1 rounded bg-blue-500 text-white text-sm"
                                    : "px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm"
                            }
                        >
                            {m}분
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <button className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg" onClick={handleMatchStart}>매칭 시작</button>
                <button className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg" onClick={() => navigate('/skinchange')}>스킨 변경</button>
                <LogoutButton />
            </div>
        </div>
    );
};

export default MainPage;