import { CalendarDays, Chrome, GraduationCap, Mail, MailCheck, School, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { GRADE_GROUPS } from "../../lib/academicCatalog.js";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthLayout } from "./AuthLayout.jsx";
import { FormAlert, FormField, PasswordField } from "./AuthFormControls.jsx";
import { ageFromDate, friendlyAuthError } from "./authHelpers.js";

const initialForm = {
  role: "student",
  fullName: "",
  email: "",
  dateOfBirth: "",
  gradeLevel: "6",
  guardianEmail: "",
  password: "",
  confirmPassword: "",
  accepted: false,
};

const ROLES = [
  { value: "student", label: "Học sinh", icon: GraduationCap },
  { value: "teacher", label: "Giáo viên", icon: School },
];

export function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [confirmationEmail, setConfirmationEmail] = useState(null);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const age = useMemo(() => ageFromDate(form.dateOfBirth), [form.dateOfBirth]);
  const isTeacher = form.role === "teacher";
  const guardianRequired = !isTeacher && age !== null && age < 16;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null }));
  }

  function validate() {
    const nextErrors = {};
    if (form.fullName.trim().length < 2) nextErrors.fullName = "Vui lòng nhập họ tên đầy đủ.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Email không hợp lệ.";
    if (!isTeacher) {
      if (age === null || age < 5 || age > 100) nextErrors.dateOfBirth = "Ngày sinh không hợp lệ.";
      if (!Number.isInteger(Number(form.gradeLevel)) || Number(form.gradeLevel) < 1 || Number(form.gradeLevel) > 12) {
        nextErrors.gradeLevel = "Vui lòng chọn lớp từ 1 đến 12.";
      }
      if (guardianRequired && !/^\S+@\S+\.\S+$/.test(form.guardianEmail)) {
        nextErrors.guardianEmail = "Cần email người giám hộ cho học sinh dưới 16 tuổi.";
      }
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      nextErrors.password = "Dùng ít nhất 8 ký tự, gồm chữ và số.";
    }
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    if (!form.accepted) nextErrors.accepted = "Bạn cần xác nhận điều khoản và chính sách dữ liệu.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    const profile = isTeacher
      ? { role: "teacher", fullName: form.fullName.trim() }
      : {
          role: "student",
          fullName: form.fullName.trim(),
          gradeLevel: Number(form.gradeLevel),
          dateOfBirth: form.dateOfBirth,
          guardianEmail: guardianRequired ? form.guardianEmail.trim().toLowerCase() : null,
        };
    const signUpData = isTeacher
      ? { full_name: profile.fullName, role: "teacher" }
      : {
          full_name: profile.fullName,
          grade_level: profile.gradeLevel,
          date_of_birth: profile.dateOfBirth,
          guardian_email: profile.guardianEmail,
          role: "student",
        };
    const result = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: signUpData },
    });
    if (result.error) {
      setServerError(friendlyAuthError(result.error));
      setSubmitting(false);
      return;
    }
    if (result.data.session) {
      try {
        await completeOnboarding(profile, result.data.session);
        navigate("/", { replace: true });
      } catch (bootstrapError) {
        setServerError(friendlyAuthError(bootstrapError));
        setSubmitting(false);
      }
      return;
    }
    setConfirmationEmail(form.email.trim().toLowerCase());
    setSubmitting(false);
  }

  async function continueWithGoogle() {
    setServerError(null);
    window.sessionStorage.setItem("eduone.pendingRole", form.role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      window.sessionStorage.removeItem("eduone.pendingRole");
      setServerError(friendlyAuthError(error));
    }
  }

  if (confirmationEmail) {
    return (
      <AuthLayout eyebrow="Xác nhận email" title="Kiểm tra hộp thư của bạn" description={`EduOne đã gửi liên kết xác nhận tới ${confirmationEmail}.`}>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <MailCheck size={28} />
          <p className="mt-4 text-sm font-bold leading-6">Sau khi xác nhận email, hãy đăng nhập để hoàn tất hồ sơ.</p>
        </div>
        <Link to="/login" className="auth-primary-button mt-6">Về trang đăng nhập</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Tạo tài khoản" title="Bắt đầu với EduOne" description="Chọn vai trò phù hợp. Tài khoản quản trị viên vẫn do Admin cấp.">
      <FormAlert>{serverError}</FormAlert>

      <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Vai trò">
        {ROLES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={form.role === value}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-black transition ${
              form.role === value
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
            onClick={() => update("role", value)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <button type="button" className="auth-secondary-button mt-4" onClick={continueWithGoogle} disabled={submitting}>
        <Chrome size={18} />
        Tiếp tục với Google ({isTeacher ? "Giáo viên" : "Học sinh"})
      </button>
      <div className="my-6 flex items-center gap-3 text-xs font-bold text-slate-400"><span className="h-px flex-1 bg-slate-200" />hoặc dùng email<span className="h-px flex-1 bg-slate-200" /></div>

      <form className="space-y-5" onSubmit={submit}>
        <FormField label="Họ và tên" icon={UserRound} autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} error={errors.fullName} required />
        <FormField label="Email" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} error={errors.email} required />
        {!isTeacher && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Ngày sinh" icon={CalendarDays} type="date" value={form.dateOfBirth} onInput={(event) => update("dateOfBirth", event.currentTarget.value)} error={errors.dateOfBirth} required />
              <label className="block">
                <span className="mb-2 block text-xs font-black text-slate-700">Lớp hiện tại</span>
                <select className="auth-input px-3.5" value={form.gradeLevel} onChange={(event) => update("gradeLevel", event.target.value)} aria-invalid={Boolean(errors.gradeLevel)}>
                  {GRADE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.grades.map((gradeLevel) => <option key={gradeLevel} value={gradeLevel}>Lớp {gradeLevel}</option>)}
                    </optgroup>
                  ))}
                </select>
                {errors.gradeLevel && <span className="mt-1.5 block text-xs font-bold text-rose-600">{errors.gradeLevel}</span>}
              </label>
            </div>
            {guardianRequired && (
              <FormField label="Email người giám hộ" icon={Mail} type="email" value={form.guardianEmail} onChange={(event) => update("guardianEmail", event.target.value)} error={errors.guardianEmail} required />
            )}
          </>
        )}
        <PasswordField label="Mật khẩu" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} error={errors.password} required />
        <PasswordField label="Xác nhận mật khẩu" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} error={errors.confirmPassword} required />
        <label className="flex items-start gap-3 text-xs font-semibold leading-5 text-slate-600">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={form.accepted} onChange={(event) => update("accepted", event.target.checked)} />
          <span>Tôi đồng ý với điều khoản sử dụng và việc xử lý dữ liệu cần thiết để vận hành tài khoản.</span>
        </label>
        {errors.accepted && <p className="text-xs font-bold text-rose-600">{errors.accepted}</p>}
        <button className="auth-primary-button" type="submit" disabled={submitting}>
          {submitting ? "Đang tạo tài khoản..." : `Tạo tài khoản ${isTeacher ? "giáo viên" : "học sinh"}`}
        </button>
      </form>
      <p className="mt-7 text-center text-sm font-semibold text-slate-600">Đã có tài khoản? <Link to="/login" className="font-black text-emerald-700">Đăng nhập</Link></p>
    </AuthLayout>
  );
}
