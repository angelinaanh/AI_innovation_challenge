import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthLayout } from "./AuthLayout.jsx";
import { FormAlert, PasswordField } from "./AuthFormControls.jsx";
import { AuthLoadingScreen } from "./AuthLoadingScreen.jsx";
import { friendlyAuthError } from "./authHelpers.js";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <AuthLoadingScreen label="Đang kiểm tra liên kết bảo mật" />;
  if (!session) {
    return (
      <AuthLayout eyebrow="Liên kết không hợp lệ" title="Yêu cầu đặt lại đã hết hạn" description="Hãy yêu cầu một liên kết mới để tiếp tục.">
        <Link to="/forgot-password" className="auth-primary-button">Gửi lại liên kết</Link>
        <Link to="/login" className="auth-secondary-button mt-4">Về trang đăng nhập</Link>
      </AuthLayout>
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Dùng ít nhất 8 ký tự, gồm chữ và số.");
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await supabase.auth.updateUser({ password });
    if (result.error) {
      setError(friendlyAuthError(result.error));
      setSubmitting(false);
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <AuthLayout eyebrow="Bảo mật tài khoản" title="Tạo mật khẩu mới" description="Mật khẩu mới sẽ được áp dụng cho lần đăng nhập tiếp theo.">
      <FormAlert>{error}</FormAlert>
      <form className="mt-5 space-y-5" onSubmit={submit}>
        <PasswordField label="Mật khẩu mới" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <PasswordField label="Xác nhận mật khẩu" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        <button className="auth-primary-button" type="submit" disabled={submitting}><CheckCircle2 size={18} />{submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</button>
      </form>
    </AuthLayout>
  );
}
