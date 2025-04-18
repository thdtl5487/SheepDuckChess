import express from 'express';
import dotenv from 'dotenv';
import authMiddleware from './middlewares/auth';
// import testRouter from './api-server/routes/testRoutes';

console.log("1");
dotenv.config({path: './src/shared/config/.env'});
console.log("2");

const app = express();
const port = process.env.PORT || 3000;
console.log("3");
app.use(express.json());
console.log("4");

app.get('/', (req, res)=>{ // 화면에 전송되는 데이타
    res.send('서버 실행 중~~');
})



app.listen(port, ()=>{
    console.log(`서버 실행 포트 : ${port}`);
})