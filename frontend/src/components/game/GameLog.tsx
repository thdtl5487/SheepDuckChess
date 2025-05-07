import React from "react";

interface GameLogProps {
    moves?: string[]; // 예: ["e4", "e5", "Nf3", "Nc6"]
}

const GameLog = ({ moves = [] }: GameLogProps) => {
    return (
        <div className="p-4 w-full md:w-1/2 max-h-48 overflow-y-auto bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700">
            <div className="font-semibold mb-2">Game Log</div>
            <ol className="text-sm text-gray-300 list-decimal list-inside">
                {moves.map((move, index) => (
                    <li key={index}>{move}</li>
                ))}
            </ol>
        </div>
    );
};

export default GameLog;