import { atom } from 'recoil';

export interface User {
    usn: number;
    nick: string;
    rating: number;
    money: number;
    free_cash: number;
    real_cash: number;
    pieceSkin: {
        pawn: number;
        knight: number;
        bishop: number;
        rook: number;
        queen: number;
        king: number;
    };
    boardSkin: number;
    character: number;
}
export const userAtom = atom<User | null>({
    key: 'userAtom',
    default: null,
})