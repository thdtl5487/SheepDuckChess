import { atom } from "recoil";

export interface SkinSetting {
  piece_skin_pawn: number;
  piece_skin_knight: number;
  piece_skin_bishop: number;
  piece_skin_rook: number;
  piece_skin_queen: number;
  piece_skin_king: number;
  board_skin: number;
  character_id: number;
}

export interface MatchInfo {
  gameId: string;
  yourColor: "white" | "black";
  opponentNick: string;
  userSkinSetting: SkinSetting;
  opponentSkinSetting: SkinSetting;
}

export const matchInfoAtom = atom<MatchInfo | null>({
  key: "matchInfoAtom",
  default: null,
});