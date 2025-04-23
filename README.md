# SheepDuckChess

PostgreSQL 17.4-1

backend server start command
    npm run dev:000 (api, game, match)
    npm run start:000 (api, game, match)

SERVER : 
- 1. API SERVER : 로그인 외 로비 기능 및 기타 게임 외적인 기능 수행 담당
- 2. GAME SERVER : 게임 플레이 담당
- 3. MATCH SERVER : 매칭 담당

STACK :
- TypeScript / Redis / PostgreSQL


frontend server start command
    npm start


backend/src/.env 필요항목
PGHOST=localhost
PGPORT=0000
PGUSER=계정
PGPASSWORD=비번
PGDATABASE=십덕체스
PORT_API=api서버포트
PORT_MATCH=매치서버포트
PORT_GAME=껨서버포트

REDIS_HOST=레디스 호스트 IP
REDIS_PORT=레디스 포트