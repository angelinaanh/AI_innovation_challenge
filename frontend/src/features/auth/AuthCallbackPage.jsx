import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { AuthLoadingScreen } from "./AuthLoadingScreen.jsx";

export function AuthCallbackPage() {
  const { loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) navigate("/", { replace: true });
  }, [loading, navigate]);
  return <AuthLoadingScreen label="Đang hoàn tất đăng nhập" />;
}
