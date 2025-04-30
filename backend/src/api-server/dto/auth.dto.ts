export interface SignupDTO {
    loginType: number;
    loginId: string;
    loginPw: string;
    nick: string;
    firstTeam: boolean;
}

export interface LoginDTO{
    loginType: number;
    loginId: string;
    loginPw: string;
}

export interface UserDTO{
    usn: number;
    nick: string;
    rating: number;
    money: number;
    free_cash: number;
    real_cash: number;
}

export interface UserSkinInfoDTO{
    usn: number;
    piece_skin_pawn: number;
    piece_skin_knight: number;
    piece_skin_bishop: number;
    piece_skin_rook: number;
    piece_skin_queen: number;
    piece_skin_king: number;
    board_skin: number;
    character_id: number;
}