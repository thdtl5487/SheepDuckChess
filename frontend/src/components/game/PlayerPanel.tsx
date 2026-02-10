import React from "react";

interface PlayerPanelProps {
    side: "you" | "opponent";
    nick?: string;
    rating?: number;
    characterId?: number;
    isYourTurn?: boolean;
    timeText?: string;
}

const PlayerPanel = ({ side, nick, rating, characterId, isYourTurn, timeText }: PlayerPanelProps) => {
    const isYou = side === "you";

    return (
        <div
            className={`flex items-center gap-4 p-4 w-full md:w-1/2 ${isYou ? "justify-start" : "justify-end"}`}
        >
            <div className="text-left">
                <div className="font-bold text-lg">{nick ?? (isYou ? "You" : "Opponent")}</div>
                <div className="text-sm text-gray-400">{rating ? `Rating: ${rating}` : "Unrated"}</div>
                {timeText && <div className="text-sm text-white mt-1">⏱ {timeText}</div>}
                {isYourTurn && <div className="text-green-400 text-xs mt-1">Your turn</div>}
            </div>
        </div>
    );
};

export default PlayerPanel;