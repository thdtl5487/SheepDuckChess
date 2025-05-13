// src/utils/api.ts
import axios from 'axios';

const isJarang = true;

const http = "http://";
const localhost = "localhost";

// window.location.hostname 으로 현재 접속 중인 호스트(name만 가져옴)
const host = window.location.hostname;

// 디폴트 API 포트
const API_PORT = 4000;

const envBase = "localhost"

// host가 'localhost'면 localhost:3000, 아니면 현재 호스트:3000
export const apiURL = 
        host === 'localhost'
        ? `http://localhost:${API_PORT}`
        : `${http}//${host}:${API_PORT}`;

// axios 인스턴스
export const api = axios.create({
    baseURL: apiURL,
    withCredentials: true, // 쿠키 필요하면
});

export const gameURL = isJarang === true ?
                `${http}${host}:4002` : `${http}${localhost}:4002`;
            
export const matchURL = isJarang === true ? 
                `${http}${host}:4001` : `${http}${localhost}:4001`;
