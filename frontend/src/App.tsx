// src/App.tsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import MainPage from "./pages/MainPage";
import GamePage from "./pages/GamePage";
import SkinChangePage from "./pages/SkinChangePage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/skinchange" element={<SkinChangePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
