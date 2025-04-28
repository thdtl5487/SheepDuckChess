import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { userState } from "../store/userState";
import { userInfo } from "os";
import { User } from "../types/user";
import { useEffect } from 'react';

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:4000/api/login", {
        loginType: 0,
        loginId,
        loginPw,
      });

      console.log(response);
      alert("로그인 성공!");

      setUser({
        usn: response.data.usn,
        nick: response.data.nick,
        rating: response.data.rating,
        money: response.data.money,
        free_cash: response.data.free_cash,
        real_cash: response.data.real_cash
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
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          로그인
        </button>
        <div className="text-center">
          <button onClick={() => navigate("/signup")} className="text-sm underline text-gray-400 hover:text-white">
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
