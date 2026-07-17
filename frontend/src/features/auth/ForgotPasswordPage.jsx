import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient.js";
import { AuthLayout } from "./AuthLayout.jsx";
import { FormAlert, FormField } from "./AuthFormControls.jsx";
import { friendlyAuthError } from "./authHelpers.js";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (result.error) setError(friendlyAuthError(result.error));
    else setMessage("Nếu email tồn tại, EduOne đã gửi liên kết đặt lại mật khẩu.");
    setSubmitting(false);
  }

  return (
    <AuthLayout eyebrow="Khôi phục tài khoản" title="Đặt lại mật khẩu" description="Liên kết bảo mật sẽ được gửi tới email tài khoản.">
      <FormAlert>{error}</FormAlert>
      <FormAlert tone="success">{message}</FormAlert>
      <form className="mt-5 space-y-5" onSubmit={submit}>
        <FormField label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <button className="auth-primary-button" type="submit" disabled={submitting || !email}><Send size={18} />{submitting ? "Đang gửi..." : "Gửi liên kết"}</button>
      </form>
      <Link to="/login" className="auth-secondary-button mt-5">Về trang đăng nhập</Link>
    </AuthLayout>
  );
}
