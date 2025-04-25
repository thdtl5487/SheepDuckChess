import {Pool} from 'pg';

const pool = new Pool({
    host : process.env.PGHOST,
    port : Number(process.env.PGPORT),
    user : process.env.PGUSER,
    password : process.env.PGPASSWORD,
    database : process.env.PGDATABASE
});

export default pool;
