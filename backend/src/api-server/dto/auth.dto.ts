export interface SignupDTO {
    loginType: number;
    loginId: string;
    loginPw: string;
    nick: string;
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