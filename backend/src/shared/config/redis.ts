import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

console.log(`포트 위치 : ${process.env.REDIS_PORT}`)

const redis = createClient({
    socket:{
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

redis.connect().catch(console.error);
export default redis;
