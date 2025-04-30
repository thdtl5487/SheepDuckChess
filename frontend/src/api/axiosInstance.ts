// src/api/axiosInstance.ts
import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://api.mygame.com' // ⭐ 배포할 백엔드 서버 도메인
    : 'http://localhost:4000'; // 개발 서버

const api = axios.create({
    baseURL,
    withCredentials: true, // 항상 쿠키 포함해서 요청
});

export default api;
