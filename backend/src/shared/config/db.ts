import pool from './pool';

const query = (text: string, params?: any[]) => pool.query(text, params);

export default query;
