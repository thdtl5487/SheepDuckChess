import { useState } from "react";
import { Piece } from "../../types/piece";

type UseChessDragProps = {
    tileSize: number;
    boardRef: React.RefObject<HTMLDivElement>;
    highlightedSquares: [number, number][];
    onDrop: (from: [number, number], to: [number, number], piece: Piece) => void;
};

type DragInfo = {
    piece: Piece;
    from: [number, number];
    mouseX: number;
    mouseY: number;
} | null;

export function useChessDrag({
    tileSize,
    boardRef,
    highlightedSquares,
    onDrop,
}: UseChessDragProps) {
    const [dragInfo, setDragInfo] = useState<DragInfo>(null);

    // 드래그 시작
    function handleDragStart(
        e: React.MouseEvent,
        x: number,
        y: number,
        piece: Piece
    ) {
        e.preventDefault();
        setDragInfo({
            piece,
            from: [x, y],
            mouseX: e.clientX,
            mouseY: e.clientY,
        });
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    }

    // 드래그 이동
    function handleDragMove(e: MouseEvent) {
        setDragInfo((prev) =>
            prev ? { ...prev, mouseX: e.clientX, mouseY: e.clientY } : null
        );
    }

    // 드래그 종료(드랍)
    function handleDragEnd(e: MouseEvent) {
        if (!dragInfo) return;
        const rect = boardRef.current?.getBoundingClientRect();
        if (rect) {
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            const tileX = Math.floor(relX / tileSize);
            const tileY = Math.floor(relY / tileSize);

            const isValid = highlightedSquares.some(
                ([hx, hy]) => hx === tileX && hy === tileY
            );
            if (isValid) {
                onDrop(dragInfo.from, [tileX, tileY], dragInfo.piece);
            }
        }
        setDragInfo(null);
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
    }

    // 드래그 프리뷰 렌더용 값 반환
    return {
        dragInfo,
        handleDragStart,
    };
}
