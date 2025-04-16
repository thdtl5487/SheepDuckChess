import { createClient } from 'redis';
const redis = createClient();

redis.connect().catch(console.error);
export default redis;
