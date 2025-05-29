import React from "react";
import { motion } from "framer-motion";

interface OverlayEffectsProps {
    attackerImage?: string;
    victimImage?: string;
    isOpponentAttack?: boolean;
    gifKey?: number; // GIF 강제 리셋용
}

const OverlayEffects = ({
    attackerImage,
    victimImage,
    isOpponentAttack = false,
    gifKey,
}: OverlayEffectsProps) => {
    // 위치/방향 동적 계산
    const attackerStyle = isOpponentAttack
        ? "absolute right-1/4 top-1/3 w-32 h-32 object-contain" // 상대가 공격자
        : "absolute left-1/4 top-1/3 w-32 h-32 object-contain"; // 내가 공격자


    const victimStyle = isOpponentAttack
        ? "absolute left-1/4 top-1/3 w-32 h-32 object-contain" // 내가 피격자
        : "absolute right-1/4 top-1/3 w-32 h-32 object-contain"; // 상대가 피격자


    // 이미지 flip 방향 (마주보게)
    const attackerImgStyle = {
        transform: isOpponentAttack ? "scaleX(1)" : "scaleX(-1)",
    };
    const victimImgStyle = {
        // filter: isOpponentAttack ? "brightness(0.5)" : undefined,
        transform: isOpponentAttack ? "scaleX(-1)" : "scaleX(1)",
    };
    console.log('isOpponentAttack : ', isOpponentAttack);

    return (
        <div className="absolute inset-0 z-40 pointer-events-none">
            {/* 공격자 애니메이션 */}
            {attackerImage && (
                <motion.img
                    key={gifKey ? `attacker-${gifKey}` : undefined}
                    src={attackerImage + (gifKey ? `?t=${gifKey}` : "")}
                    alt="attacker"
                    initial={{
                        scaleX: isOpponentAttack ? -1 : 1,
                        x: isOpponentAttack ? 400 : -400,
                        opacity: 0
                    }}
                    animate={{
                        scaleX: isOpponentAttack ? -1 : 1,
                        x: 0,
                        opacity: 1,
                        scale: [2]
                    }}
                    transition={{ duration: 0.4 }}
                    className={attackerStyle}
                    style={attackerImgStyle}
                />
            )}
            {/* 피격자 애니메이션 */}
            {victimImage && (
                <motion.img
                    key={gifKey ? `victim-${gifKey}` : undefined}
                    src={victimImage + (gifKey ? `?t=${gifKey}` : "")}
                    alt="victim"
                    initial={{
                        scaleX: isOpponentAttack ? 1 : -1,
                        scale: 1,
                        opacity: 0
                    }}
                    animate={{
                        scaleX: isOpponentAttack ? 1 : -1,
                        scale: [2, 2.1, 1.9, 2],
                        opacity: [1, 0.8, 0.5, 0.5],
                    }}
                    transition={{
                        delay: 0.1,
                        duration: 0.5,
                        ease: "easeInOut",
                    }}
                    className={victimStyle}
                    style={victimImgStyle}
                />
            )}
        </div>
    );
};

export default OverlayEffects;
