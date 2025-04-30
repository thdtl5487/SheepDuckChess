import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";

export default function SignUpPage() {
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [nick, setNick] = useState("");
  const [firstTeam, setFirstTeam] = useState<boolean | null>(null); // 팀 선택
  const navigate = useNavigate();

  const handleSignUp = async () => {

    if(firstTeam === null){
      alert('첫 시작 팀을 선택해주세요! \n※언제든지 게임 안에서 바꿀 수 있습니다.');
    }

    try {
      const response = await api.post("/api/signup", {
        loginType: 0,
        loginId,
        loginPw,
        nick,
        firstTeam
      });

      alert("회원가입 성공!");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.msg || "회원가입 실패");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">회원가입</h1>
      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="아이디"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={loginPw}
          onChange={(e) => setLoginPw(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
        />
        <input
          type="nick"
          placeholder="닉네임"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
        />
              <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${firstTeam === true ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFirstTeam(true)}
        >
          🐑 양팀으로 시작
        </button>
        <button
          className={`px-4 py-2 rounded ${firstTeam === false ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFirstTeam(false)}
        >
          🦆 오리팀으로 시작
        </button>
      </div>
        <button
          onClick={handleSignUp}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
