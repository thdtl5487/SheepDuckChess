import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      usn: number;
      nick: string;
    };
  }
}
