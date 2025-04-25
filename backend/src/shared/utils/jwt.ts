import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms'; 

const secret = process.env.JWT_SECRET || 'my-s';

export const signToken = (payload: object, expiresIn: StringValue = '1d') => {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, secret);
};
