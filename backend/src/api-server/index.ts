import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import authMiddleware from '../middlewares/auth';
import testRouter from './routes/testRoutes';

dotenv.config({
    path: path.resolve(__dirname, '../shared/config/.env')
});

const app = express();
const port = process.env.PORT_API || 4444;

app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', testRouter);

app.get('/', (req, res)=>{ // 화면에 전송되는 데이타
    res.send('서버 실행 중~~');
})

app.listen(port, ()=>{
    console.log(`서버 실행 포트 : ${port}`);
})