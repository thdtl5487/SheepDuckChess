import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { userState } from "../store/userState";
import { ReactElement } from "react";
import LogoutButton from "../components/btn_logout";
import axios from "axios";
import api from "../api/axiosInstance";

const MainPage = (): ReactElement | null => {
    const [user, setUser] = useRecoilState(userState);
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false); // 로딩 체크용 상태 추가

    useEffect(() => {
        console.log("유즈이펙트 시작!!");
        const fetchUser = async () => {
            console.log("fetchUser 시작!!");
            try {
                if (!user) {
                    console.log("유저가없음!!")
                    const res = await api.post("/api/getUserInfoByRFToken", {}, { withCredentials: true });
                    console.log("respon : ", res);
                    setUser(res.data);
                }
            } catch (err : any) {
                console.log("자동 로그인 실패 → 로그인 페이지로", err.response?.status, err.response?.data || err.message);
                navigate("/login");
            }
        };

        fetchUser();
        setChecked(true);
    }, [user, setUser, navigate]);


    if (!checked) {
        // 아직 로딩 체크 안 끝났으면 아무것도 안 보여줌
        return (
            <div>로딩중</div>);
    }

    if (!user) {
        // 이건 사실상 필요 없긴 한데 혹시 모를 안전장치로 남겨둠
        return (
            <div>유저가없음</div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-6">🐑 Welcome SheepDuckChess 🦆</h1>
            <h1 className="text-3xl font-bold mb-6">🐑 {user.nick} 🦆</h1>
            <div className="flex flex-col gap-4">
                <button className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg">매칭 시작</button>
                <button className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg">스킨 변경</button>
                <LogoutButton />
            </div>
        </div>
    );
};

export default MainPage;
