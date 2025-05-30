// src/components/skin/btn_skinFilter.tsx

import React from "react";

interface SkinFilterButtonsProps {
    current: "all" | "piece" | "board" | "character";
    onChange: (tab: "all" | "piece" | "board" | "character") => void;
}

const tabs = [
    { key: "all", label: "전체" },
    { key: "piece", label: "기물" },
    { key: "board", label: "보드" },
    { key: "character", label: "캐릭터" },
];

const SkinFilterButtons: React.FC<SkinFilterButtonsProps> = ({ current, onChange }) => {
    return (
        <div className="flex gap-2 mb-3">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={`px-4 py-1 rounded transition
            ${current === tab.key
                            ? "bg-blue-500 text-white font-bold"
                            : "bg-gray-200 text-gray-700 hover:bg-blue-100"}`}
                    onClick={() => onChange(tab.key as any)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default SkinFilterButtons;
