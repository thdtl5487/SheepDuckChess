import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// import authMiddleware from './middlewares/auth';
// import testRouter from './api-server/routes/testRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get('/', (req, res)=>{ // 화면에 전송되는 데이타
    res.send('서버 실행 중~~');
})

app.listen(port, ()=>{
    console.log(`서버 실행 포트 : ${port}`);
})