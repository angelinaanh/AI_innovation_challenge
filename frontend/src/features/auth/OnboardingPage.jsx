import { CalendarDays, Mail, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { AuthLayout } from "./AuthLayout.jsx";
import { FormAlert, FormField } from "./AuthFormControls.jsx";
import { ageFromDate, friendlyAuthError } from "./authHelpers.js";

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const metadata = user?.user_metadata || {};
  const [form, setForm] = useState({
    fullName: metadata.full_name || metadata.name || "",
    gradeBand: metadata.grade_band || "secondary",
    dateOfBirth: metadata.date_of_birth || "",
    guardianEmail: metadata.guardian_email || "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const age = useMemo(() => ageFromDate(form.dateOfBirth), [form.dateOfBirth]);
  const guardianRequired = age !== null && age < 16;

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({
        ...form,
        guardianEmail: guardianRequired ? form.guardianEmail : null,
      });
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(friendlyAuthError(submitError));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Hồ sơ học sinh" title="Hoàn tất thông tin ban đầu" description="Thông tin này xác định khối lớp và yêu cầu đồng ý của người giám hộ.">
      <FormAlert>{error}</FormAlert>
      <form className="mt-5 space-y-5" onSubmit={submit}>
        <FormField label="Họ và tên" icon={UserRound} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Ngày sinh" icon={CalendarDays} type="date" value={form.dateOfBirth} onInput={(event) => setForm({ ...form, dateOfBirth: event.currentTarget.value })} required />
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Khối lớp</span><select className="auth-input px-3.5" value={form.gradeBand} onChange={(event) => setForm({ ...form, gradeBand: event.target.value })}><option value="primary">Tiểu học</option><option value="secondary">THCS</option><option value="high_school">THPT</option></select></label>
        </div>
        {guardianRequired && <FormField label="Email người giám hộ" icon={Mail} type="email" value={form.guardianEmail} onChange={(event) => setForm({ ...form, guardianEmail: event.target.value })} required />}
        <button className="auth-primary-button" type="submit" disabled={submitting}>{submitting ? "Đang lưu hồ sơ..." : "Hoàn tất hồ sơ"}</button>
      </form>
    </AuthLayout>
  );
}
