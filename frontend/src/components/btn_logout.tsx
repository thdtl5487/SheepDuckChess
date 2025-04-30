import { useResetRecoilState } from "recoil";
import { userState } from "../store/userState";
import { useNavigate } from "react-router-dom";

export default function LogoutButton(){
    const resetUser = useResetRecoilState(userState);
    const navigate = useNavigate();

    const handleLogout = () => {
        // 쿠키 삭제
        document.cookie = "accessToken=; Max-Age=0";
        document.cookie = "refreshToken=; Max-Age=0";

        // 상태 초기화
        resetUser();

        // 로그인 페이지로 이동
        navigate("/login");
    }

    return(
        <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg hover:text-red-600 underline"
        >
            LOGOUT
        </button>
    )
}