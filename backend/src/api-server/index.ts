import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import { requireAuth } from '../middlewares/auth';
import cors from 'cors';
import cookieParser = require('cookie-parser');
import { getUserInfo } from './controller/authController';

dotenv.config();

console.log("PGUSER", process.env.PGUSER);

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app = express();

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}))

const port = process.env.PORT_API || 4444;

app.use(express.json());
app.use(cookieParser());
app.use('/api', authRoutes);

app.get('/', (req, res)=>{ // 화면에 전송되는 데이타
    res.send('서버 실행 중~~');
})

app.get('/api/me', requireAuth, getUserInfo);

app.listen(port, ()=>{
    console.log(`서버 실행 포트 : ${port}`);
})