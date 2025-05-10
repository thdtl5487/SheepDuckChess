import { atom } from "recoil";

export const matchInfoAtom = atom<{
  gameId: string;
  yourColor: "white" | "black";
  opponentNick: string;
} | null>({
  key: "matchInfoAtom",
  default: null,
});
