import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * MatchOverlayProps
 * - opponentNick: 상대 닉네임
 * - yourColor: white | black
 * - onEnterQueue: 성문 내려온 뒤 매칭 시작 트리거
 * - onFinished: 매칭 완료 후 성문 올라간 뒤 페이지 이동
 */
type MatchOverlayProps = {
    opponentNick?: string;
    yourColor?: "white" | "black";
    onEnterQueue?: () => void;
    onFinished?: () => void;
};

const MatchOverlay = ({ opponentNick, yourColor, onEnterQueue, onFinished }: MatchOverlayProps) => {
    const [gateUp, setGateUp] = useState(false);
    const [showAvatars, setShowAvatars] = useState(false);
    const [matched, setMatched] = useState(false);
    const [bounceOnEnter, setBounceOnEnter] = useState(false);
    const [bounceOnExit, setBounceOnExit] = useState(false);
    

    

    /**
     * 초기 애니메이션 흐름:
     * 1. 성문 내려오기 → onEnterQueue() 호출
     * 2. 상대 매칭 성공 시 matchedInfo 상태 변화 감지
     * 3. 캐릭터 등장 + 성문 올라감 + onFinished() 실행
     */
    useEffect(() => {
        const timer1 = setTimeout(() => {
            setBounceOnEnter(true);
            if (onEnterQueue) onEnterQueue(); // 성문 내려온 후 매칭 시작
        }, 1000);

        return () => {
            clearTimeout(timer1);
        };
    }, []);

    // 매칭 성공 시 matched → true 로 외부에서 상태 연결 필요
    useEffect(() => {
        if (!opponentNick || !yourColor) return;
        setMatched(true);
    }, [opponentNick, yourColor]);

    useEffect(() => {
        if (!matched) return;

        const timer1 = setTimeout(() => {
            setShowAvatars(true);
        }, 500);
        const timer2 = setTimeout(() => {
            console.log(`bounceOnExit start : ${bounceOnExit}`);
            setBounceOnExit(true)
            console.log(`bounceOnExit end : ${bounceOnExit}`);
            setGateUp(true); // 성문 올라감
        }, 2000);

        const timer3 = setTimeout(() => {
            if (onFinished){
                onFinished()
            }; // 페이지 이동
        }, 3000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [matched]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ top: "-100%" }} // 성문이 위에서 시작
                animate={{ top: gateUp ? "-100%" : "0%" }} // 올라가거나 내려오거나
                transition={{ duration: 1, ease: "easeOut" }}
                className="fixed top-0 left-0 w-full h-full z-50 bg-black"
            >
                {/* 성문 이미지 + 덜컹 연출 */}
                <motion.img
                    src="/asset/gate.png"
                    alt="gate"
                    className="w-full h-full object-cover absolute top-0 left-0"
                    animate={{
                        y: bounceOnExit
                            ? [0, -80, 4, -2, 0] // 올라가기 직전 덜컹
                            : bounceOnEnter
                                ? [0, -10, 5, -5, 0]  // 내려온 직후 덜컹
                                : 0
                    }}
                    transition={{
                        duration: 0.4,
                        ease: "easeInOut"
                    }}
                />

                {showAvatars && (
                    <div className="absolute top-1/2 flex justify-between w-full px-16 z-10">
                        <div className="text-white text-xl">You ({yourColor})</div>
                        <div className="text-white text-xl">{opponentNick}</div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default MatchOverlay;
