import { Chrome, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthLayout } from "./AuthLayout.jsx";
import { FormAlert, FormField, PasswordField } from "./AuthFormControls.jsx";
import { friendlyAuthError, returnPathForRole, safeReturnPath } from "./authHelpers.js";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeReturnPath(new URLSearchParams(location.search).get("returnTo"));

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (result.error) {
      setError(friendlyAuthError(result.error));
      setSubmitting(false);
      return;
    }
    try {
      const account = await api.getMe(undefined, result.data.session?.access_token);
      navigate(returnPathForRole(returnTo, account.role), { replace: true });
    } catch (accountError) {
      setError(friendlyAuthError(accountError));
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    setSubmitting(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(friendlyAuthError(oauthError));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Tài khoản EduOne"
      title="Chào mừng bạn trở lại"
      description="Đăng nhập để tiếp tục đúng lộ trình và tiến độ của bạn."
    >
      <FormAlert>{error}</FormAlert>
      <button type="button" className="auth-secondary-button mt-4" onClick={continueWithGoogle} disabled={submitting}>
        <Chrome size={18} />
        Tiếp tục với Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-bold text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        hoặc dùng email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <FormField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-black text-emerald-700 hover:text-emerald-900">
            Quên mật khẩu?
          </Link>
        </div>
        <button className="auth-primary-button" type="submit" disabled={submitting || !email || !password}>
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm font-semibold text-slate-600">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-black text-emerald-700 hover:text-emerald-900">Đăng ký</Link>
      </p>
    </AuthLayout>
  );
}
