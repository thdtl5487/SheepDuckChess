import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { userState } from "../store/userState";
import { userInfo } from "os";
import { User } from "../types/user";
import { useEffect } from 'react';
import api from "../api/axiosInstance";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userState); // Recoil의 state 저장

  const handleLogin = async () => {
    try {
      const res = await api.post("/api/login", {
        loginType: 0,
        loginId,
        loginPw,
      });

      setUser({
        usn: res.data.usn,
        nick: res.data.nick,
        rating: res.data.rating,
        money: res.data.money,
        free_cash: res.data.free_cash,
        real_cash: res.data.real_cash,
        pieceSkin: res.data.pieceSkin,
        boardSkin: res.data.boardSkin,
        character: res.data.character,
      });

      navigate("/main"); // 나중에 메인 페이지로 이동

    } catch (err: any) {
      alert(err.response?.data?.msg || "로그인 실패");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">로그인</h1>
      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <input
            type="text"
            placeholder="아이디"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={loginPw}
            onChange={(e) => setLoginPw(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" >
            로그인
          </button>
        </form>

        <div className="text-center">
          <button onClick={() => navigate("/signup")} className="text-sm underline text-gray-400 hover:text-white">
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
