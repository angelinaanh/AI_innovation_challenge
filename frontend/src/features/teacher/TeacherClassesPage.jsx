import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Plus,
  School,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert, FormField } from "../auth/AuthFormControls.jsx";

const gradeLabels = {
  primary: "Tiểu học",
  secondary: "THCS",
  high_school: "THPT",
};

const axisStyles = {
  S: "bg-emerald-100 text-emerald-800",
  T: "bg-sky-100 text-sky-800",
  E: "bg-amber-100 text-amber-800",
  A: "bg-rose-100 text-rose-800",
  M: "bg-violet-100 text-violet-800",
};

const gradeRangeByBand = {
  primary: [1, 5],
  secondary: [6, 9],
  high_school: [10, 12],
};

// Khớp backend classroomRules.js SUBJECT_GRADE_RANGES — bảng GDPT 2018 cố
// định, dùng làm nguồn sự thật cho lọc môn thay vì chỉ dựa vào
// subjects.min_grade/max_grade (cột này có thể chưa có nếu migration 0004
// chưa apply trên môi trường đang chạy).
const subjectGradeRanges = {
  primary: {
    "Tự nhiên & Xã hội": [1, 3],
    "Khoa học": [4, 5],
    "Tin học": [3, 5],
    "Công nghệ": [3, 5],
    "Tiếng Việt": [1, 5],
    "Mỹ thuật": [1, 5],
    "Âm nhạc": [1, 5],
    "Đạo đức": [1, 5],
    "Toán": [1, 5],
  },
  secondary: {
    "Khoa học tự nhiên": [6, 9],
    "Tin học": [6, 9],
    "Công nghệ": [6, 9],
    "Ngữ văn": [6, 9],
    "Mỹ thuật": [6, 9],
    "Âm nhạc": [6, 9],
    "Lịch sử & Địa lý": [6, 9],
    "Toán": [6, 9],
  },
  high_school: {
    "Vật lý": [10, 12],
    "Hóa học": [10, 12],
    "Sinh học": [10, 12],
    "Tin học": [10, 12],
    "Công nghệ": [10, 12],
    "Ngữ văn": [10, 12],
    "Mỹ thuật": [10, 12],
    "Âm nhạc": [10, 12],
    "Lịch sử": [10, 12],
    "Địa lý": [10, 12],
    "Toán": [10, 12],
  },
};

function isSubjectInGrade(subject, gradeBand, grade) {
  const fixedRange = subjectGradeRanges[gradeBand]?.[subject.name];
  if (fixedRange) return grade >= fixedRange[0] && grade <= fixedRange[1];
  if (subject.min_grade != null && subject.max_grade != null) {
    return grade >= subject.min_grade && grade <= subject.max_grade;
  }
  return subject.grade_band === gradeBand;
}

const initialForm = {
  name: "",
  gradeBand: "secondary",
  grade: "",
  subjectIds: [],
  description: "",
  maxMembers: "",
};

export function TeacherClassesPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();

  const gradeOptions = useMemo(() => {
    const [from, to] = gradeRangeByBand[form.gradeBand] || [];
    if (!from) return [];
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [form.gradeBand]);

  const visibleSubjects = useMemo(() => {
    if (!form.grade) return [];
    return subjects.filter((subject) => subject.grade_band === form.gradeBand
      && isSubjectInGrade(subject, form.gradeBand, form.grade));
  }, [form.gradeBand, form.grade, subjects]);
  const studentCount = classes.reduce((sum, item) => sum + item.memberCount, 0);
  const pendingCount = classes.reduce((sum, item) => sum + item.pendingCount, 0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classRows, subjectRows] = await Promise.all([
        api.getTeacherClasses(),
        api.getTeacherSubjects(),
      ]);
      setClasses(classRows);
      setSubjects(subjectRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("eduone:class-membership-updated", load);
    return () => window.removeEventListener("eduone:class-membership-updated", load);
  }, [load]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "gradeBand" ? { grade: "", subjectIds: [] } : {}),
      ...(field === "grade" ? { subjectIds: [] } : {}),
    }));
  }

  function toggleSubject(subjectId) {
    setForm((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(subjectId)
        ? current.subjectIds.filter((id) => id !== subjectId)
        : [...current.subjectIds, subjectId],
    }));
  }

  async function createClass(event) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await api.createTeacherClass({
        ...form,
        grade: Number(form.grade),
        maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
      });
      setCreateOpen(false);
      setForm(initialForm);
      navigate(`/teacher/classes/${created.id}`);
    } catch (createError) {
      setError(createError.message);
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Giảng dạy</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Lớp học của tôi</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Theo dõi thành viên và yêu cầu tham gia theo từng môn.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={18} />Tạo lớp</button>
      </header>

      <FormAlert>{error}</FormAlert>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan lớp học">
        {[
          { label: "Lớp đang quản lý", value: classes.length, icon: School, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Học sinh", value: studentCount, icon: Users, tone: "bg-sky-50 text-sky-700" },
          { label: "Chờ xử lý", value: pendingCount, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="surface flex min-h-24 items-center gap-4 p-4">
            <div className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}><Icon size={21} /></div>
            <div><p className="text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>
          </div>
        ))}
      </section>

      <section aria-labelledby="class-list-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="class-list-title" className="section-title">Danh sách lớp</h2>
          {!loading && <span className="text-xs font-bold text-slate-400">{classes.length} lớp</span>}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton h-52" />)}
          </div>
        ) : classes.length === 0 ? (
          <div className="surface px-6 py-12 text-center">
            <School className="mx-auto text-slate-300" size={36} />
            <h3 className="mt-4 text-lg font-black">Chưa có lớp học</h3>
            <button type="button" className="primary-button mt-5" onClick={() => setCreateOpen(true)}><Plus size={17} />Tạo lớp đầu tiên</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((item) => (
              <Link key={item.id} to={`/teacher/classes/${item.id}`} className="surface group block min-h-52 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-white"><BookOpenCheck size={21} /></div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {(item.subjects?.length ? item.subjects : [null]).map((subject, index) => (
                      <span key={subject?.id || index} className={`rounded-md px-2 py-1 text-xs font-black ${axisStyles[subject?.steam_axis] || "bg-slate-100 text-slate-600"}`}>{subject?.steam_axis || "STEAM"}</span>
                    ))}
                  </div>
                </div>
                <h3 className="mt-5 truncate text-lg font-black text-slate-950">{item.name}</h3>
                <p className="mt-1 truncate text-sm font-bold text-slate-500">{item.subjects?.length ? item.subjects.map((s) => s.name).join(", ") : "Chưa chọn môn"} · {item.grade ? `Lớp ${item.grade}` : gradeLabels[item.grade_band]}</p>
                <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                  <span>{item.memberCount}{item.max_members ? `/${item.max_members}` : ""} học sinh</span>
                  <span>{item.pendingCount} chờ duyệt</span>
                  <ArrowRight className="ml-auto text-emerald-700 transition group-hover:translate-x-1" size={18} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {createOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 p-4" role="presentation">
          <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-class-title">
            <div className="flex items-center justify-between gap-4">
              <div><p className="eyebrow">Lớp mới</p><h2 id="create-class-title" className="mt-1 text-xl font-black">Tạo lớp học</h2></div>
              <button type="button" className="icon-button inline-grid" aria-label="Đóng" title="Đóng" onClick={() => setCreateOpen(false)}><X size={20} /></button>
            </div>
            <form className="mt-6 space-y-5" onSubmit={createClass}>
              <FormField label="Tên lớp" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ví dụ: Scratch cơ bản 6A" required />
              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Khối lớp</span><select className="auth-input px-3.5" value={form.gradeBand} onChange={(event) => update("gradeBand", event.target.value)}><option value="primary">Tiểu học</option><option value="secondary">THCS</option><option value="high_school">THPT</option></select></label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black text-slate-700">Lớp</span>
                  <select className="auth-input px-3.5" value={form.grade} onChange={(event) => update("grade", Number(event.target.value))} required>
                    <option value="">Chọn lớp</option>
                    {gradeOptions.map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                  </select>
                </label>
                <FormField label="Số thành viên tối đa" type="number" min={1} max={100} value={form.maxMembers} onChange={(event) => update("maxMembers", event.target.value)} placeholder="Không giới hạn" />
              </div>
              <div className="block">
                <span className="mb-2 block text-xs font-black text-slate-700">Môn học ({form.subjectIds.length} đã chọn)</span>
                {!form.grade ? (
                  <p className="text-xs font-bold text-slate-400">Chọn lớp trước khi chọn môn học.</p>
                ) : visibleSubjects.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">Chưa có môn học cho lớp này.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {visibleSubjects.map((subject) => {
                      const active = form.subjectIds.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-black transition ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}
                        >
                          [{subject.steam_axis}] {subject.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Mô tả</span><textarea className="auth-input min-h-24 resize-y px-3.5 py-3" maxLength={500} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Mục tiêu hoặc lịch học của lớp" /></label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Hủy</button>
                <button type="submit" className="primary-button" disabled={creating || !form.name || !form.grade || form.subjectIds.length === 0}>{creating ? "Đang tạo..." : "Tạo lớp"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
