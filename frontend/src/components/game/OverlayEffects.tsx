import React from "react";
import { motion } from "framer-motion";

interface OverlayEffectsProps {
    attackerImage?: string;
    victimImage?: string;
    triggerFrame?: number; // 타격 타이밍을 맞추기 위한 프레임 정보
    isVisible?: boolean;
}

const OverlayEffects = ({
    attackerImage,
    victimImage,
    triggerFrame = 10,
    isVisible = false,
}: OverlayEffectsProps) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-40 pointer-events-none">
            {/* 공격자 애니메이션 */}
            {attackerImage && (
                <motion.img
                    src={attackerImage}
                    alt="attacker"
                    initial={{ x: -200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute left-1/4 top-1/3 w-32 h-32 object-contain"
                />
            )}

            {/* 피격자 애니메이션 */}
            {victimImage && (
                <motion.img
                    src={victimImage}
                    alt="victim"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 0.9, 1], opacity: [1, 0.8, 0.5, 0] }}
                    transition={{
                        delay: triggerFrame * (1 / 60), // 프레임 → 초로 변환
                        duration: 0.5,
                        ease: "easeInOut",
                    }}
                    className="absolute right-1/4 top-1/3 w-32 h-32 object-contain"
                />
            )}
        </div>
    );
};

export default OverlayEffects;