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
        ? "absolute right-1/4 top-1/3 w-32 h-32 object-contain"
        : "absolute left-1/4 top-1/3 w-32 h-32 object-contain";
    const victimStyle = isOpponentAttack
        ? "absolute left-1/4 top-1/3 w-32 h-32 object-contain"
        : "absolute right-1/4 top-1/3 w-32 h-32 object-contain";

    // 이미지 flip 방향 (마주보게)
    const attackerImgStyle = {
        transform: attackerStyle.includes("left") ? "scaleX(-1)" : undefined,
    };
    const victimImgStyle = {
        filter: isOpponentAttack ? "brightness(0.5)" : undefined,
        transform: victimStyle.includes("left") ? "scaleX(-1)" : undefined,
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
                    initial={{ x: isOpponentAttack ? 200 : -200, opacity: 0 }}
                    animate={{
                        x: 0,
                        opacity: 1,
                        scale: [2.5]
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
                    initial={{ scale: 2.5 }}
                    animate={{
                        scale: [2.5],
                        opacity: [1, 0.8, 0.5, 0],
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
