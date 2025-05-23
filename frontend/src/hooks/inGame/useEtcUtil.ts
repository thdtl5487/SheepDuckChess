import type { Piece } from "../../types/piece";

// boardArr: Piece[] (turnResult.board)
export function boardTo2D(boardArr: Piece[]): (Piece | null)[][] {
    const grid: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    boardArr.forEach(piece => {
        const x = "abcdefgh".indexOf(piece.position[0]);
        const y = 8 - parseInt(piece.position[1]);
        if (x >= 0 && y >= 0 && y < 8) grid[y][x] = piece;
    });
    return grid;
}
