import express from 'express';
import dotenv from 'dotenv';

dotenv.config({path: './src/config/.env'});

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res)=>{ // 화면에 전송되는 데이타
    res.send('서버 실행 중~~');
})

app.listen(port, ()=>{
    console.log(`서버 실행 포트 : ${port}`);
})