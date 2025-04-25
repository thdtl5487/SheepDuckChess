import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms'; 

const secret = process.env.JWT_SECRET || 'my-secret-key';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh';

export const signToken = (usn: number, expiresIn: StringValue = '1d') => {
    const options: SignOptions = { expiresIn };
    return jwt.sign({ usn }, secret, options); // ✅ payload를 객체로
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, secret);
};


export const signRefreshToken = (usn: number, expiresIn: StringValue = '7d') => {
    const options: SignOptions = { expiresIn };
    return jwt.sign({ usn }, refreshSecret, options); // ✅ 동일하게
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, refreshSecret);
};