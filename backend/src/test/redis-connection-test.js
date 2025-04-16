const Redis = require('ioredis');
const redis = new Redis(); // 기본은 localhost:6379

redis.set("hello", "world");
redis.get("hello", (err, result) => {
    if (err) {
        console.error("Redis 오류:", err);
    } else {
        console.log("Redis 응답:", result); // world
    }
    redis.disconnect();
});