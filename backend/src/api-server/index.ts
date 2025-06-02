import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import { requireAuth } from '../middlewares/auth';
import cors from 'cors';
import cookieParser = require('cookie-parser');
import { getUserInfo, getUserInfoByRFToken } from './controller/authController';
import gameRoutes from './routes/gameRoutes';
import skinRoutes from './routes/skinRoutes';

dotenv.config();

console.log("PGUSER", process.env.PGUSER);

const rawOrigins = process.env.CORS_ORIGIN || '';
const whitelist = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // origin이 없으면 Postman, 서버 간 호출 등이라 허용
        if (!origin) return callback(null, true);
        if (whitelist.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS 거부: ${origin}`), false);
    },
    credentials: true,
    exposedHeaders: ['set-cookie']
}))

const port = process.env.PORT_API || 4444;

app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/skin', skinRoutes);

app.get('/', (req, res) => { // 화면에 전송되는 데이타
    res.send('서버 실행 중~~');
})

app.get('/api/me', requireAuth, getUserInfo);
app.post('/api/getUserInfoByRFToken', requireAuth, getUserInfoByRFToken);


app.listen(port, () => {
    console.log(`서버 실행 포트 : ${port}`);
})