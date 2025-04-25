import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production' || process.env.IS_PRODUCT_ENV === 'production';

export const setCookie = (
    res: Response,
    name: string,
    value: string,
    maxAgeMs: number
) => {
    res.cookie(name, value, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: maxAgeMs,
    });
};

export const clearCookie = (res: Response, name: string) => {
    res.clearCookie(name, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
    });
};
