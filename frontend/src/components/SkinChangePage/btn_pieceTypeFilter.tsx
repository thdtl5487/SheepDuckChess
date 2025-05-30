// src/components/skin/btn_pieceTypeFilter.tsx

import React from "react";

type PieceType = "all" | "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

interface PieceTypeFilterButtonsProps {
    current: PieceType;
    onChange: (type: PieceType) => void;
}

const pieceTypes = [
    { key: "all", label: "전체" },
    { key: "pawn", label: "폰" },
    { key: "knight", label: "나이트" },
    { key: "bishop", label: "비숍" },
    { key: "rook", label: "룩" },
    { key: "queen", label: "퀸" },
    { key: "king", label: "킹" },
];

const PieceTypeFilterButtons: React.FC<PieceTypeFilterButtonsProps> = ({ current, onChange }) => {
    return (
        <div className="flex gap-2 mb-4">
            {pieceTypes.map(pt => (
                <button
                    key={pt.key}
                    className={`px-3 py-1 rounded transition
            ${current === pt.key
                            ? "bg-indigo-500 text-white font-bold"
                            : "bg-gray-100 text-gray-700 hover:bg-indigo-100"}`}
                    onClick={() => onChange(pt.key as any)}
                >
                    {pt.label}
                </button>
            ))}
        </div>
    );
};

export default PieceTypeFilterButtons;
