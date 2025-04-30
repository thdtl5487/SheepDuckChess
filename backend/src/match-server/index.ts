// 서버 실행 진입점
import http from 'http';
import { WebSocketServer } from 'ws';
import { handleSocketConnection } from './ws';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT_MATCH ? parseInt(process.env.PORT_MATCH) : 8081;

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', handleSocketConnection);

server.listen(PORT, () => {
  console.log('🟢 Match Server is running on port ', PORT);
});
