import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner.jsx";
import useAuthStore from "../store/authStore.js";
import api from "../api/axios.js";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const handle = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      if (!accessToken || !refreshToken) { navigate("/login"); return; }
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      try {
        const { data } = await api.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(data.user));
        useAuthStore.setState({ user: data.user, isAuthenticated: true });
        navigate("/chat", { replace: true });
      } catch {
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    };
    handle();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size={28} />
        <p className="text-zinc-500 text-sm">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;