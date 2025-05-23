import React from "react";
import type { Piece } from "../../types/piece";

const PROMOTION_TYPES = ["queen", "rook", "bishop", "knight"] as const;

export function PromotionModal({
    color,
    onSelect,
}: {
    color: "white" | "black";
    onSelect: (type: Piece["type"]) => void;
}) {
    const icons: Record<"white" | "black", Record<string, string>> = {
        white: {
            queen: "♕",
            rook: "♖",
            bishop: "♗",
            knight: "♘",
        },
        black: {
            queen: "♛",
            rook: "♜",
            bishop: "♝",
            knight: "♞",
        },
    };

    const classNameTextAddOn = color === 'white' ? 
                    "bg-gray-700 p-4 rounded shadow-md text-center text-white" :
                    "bg-gray-700 p-4 rounded shadow-md text-center text-black";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className={classNameTextAddOn}>
                <p className="mb-2 font-bold">프로모션 선택</p>
                <div className="flex gap-4 justify-center">
                    {PROMOTION_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => onSelect(type as Piece["type"])}
                            className="text-3xl p-2 hover:bg-gray-600 rounded"
                        >
                            {icons[color][type]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
