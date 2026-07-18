import { CalendarDays, Mail, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { GRADE_GROUPS } from "../../lib/academicCatalog.js";
import { AuthLayout } from "./AuthLayout.jsx";
import { FormAlert, FormField } from "./AuthFormControls.jsx";
import { ageFromDate, friendlyAuthError } from "./authHelpers.js";

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const metadata = user?.user_metadata || {};
  const requestedRole = metadata.role
    || window.sessionStorage.getItem("eduone.pendingRole")
    || user?.app_metadata?.provisioned_role;
  const isTeacher = requestedRole === "teacher";
  const [form, setForm] = useState({
    fullName: metadata.full_name || metadata.name || "",
    gradeLevel: String(metadata.grade_level || 6),
    dateOfBirth: metadata.date_of_birth || "",
    guardianEmail: metadata.guardian_email || "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const age = useMemo(() => ageFromDate(form.dateOfBirth), [form.dateOfBirth]);
  const guardianRequired = !isTeacher && age !== null && age < 16;

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding(
        isTeacher
          ? { role: "teacher", fullName: form.fullName }
          : { role: "student", ...form, guardianEmail: guardianRequired ? form.guardianEmail : null },
      );
      window.sessionStorage.removeItem("eduone.pendingRole");
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(friendlyAuthError(submitError));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow={isTeacher ? "Hồ sơ giáo viên" : "Hồ sơ học sinh"}
      title="Hoàn tất thông tin ban đầu"
      description={isTeacher
        ? "Xác nhận họ tên để kích hoạt tài khoản giáo viên."
        : "Thông tin này xác định lớp học và yêu cầu đồng ý của người giám hộ."}
    >
      <FormAlert>{error}</FormAlert>
      <form className="mt-5 space-y-5" onSubmit={submit}>
        <FormField label="Họ và tên" icon={UserRound} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
        {!isTeacher && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Ngày sinh" icon={CalendarDays} type="date" value={form.dateOfBirth} onInput={(event) => setForm({ ...form, dateOfBirth: event.currentTarget.value })} required />
              <label className="block">
                <span className="mb-2 block text-xs font-black text-slate-700">Lớp hiện tại</span>
                <select className="auth-input px-3.5" value={form.gradeLevel} onChange={(event) => setForm({ ...form, gradeLevel: event.target.value })}>
                  {GRADE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.grades.map((gradeLevel) => <option key={gradeLevel} value={gradeLevel}>Lớp {gradeLevel}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
            {guardianRequired && <FormField label="Email người giám hộ" icon={Mail} type="email" value={form.guardianEmail} onChange={(event) => setForm({ ...form, guardianEmail: event.target.value })} required />}
          </>
        )}
        <button className="auth-primary-button" type="submit" disabled={submitting}>{submitting ? "Đang lưu hồ sơ..." : "Hoàn tất hồ sơ"}</button>
      </form>
    </AuthLayout>
  );
}
