import {
  ArrowLeft,
  Check,
  Clipboard,
  MailPlus,
  RefreshCw,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert, FormField } from "../auth/AuthFormControls.jsx";

const gradeLabels = {
  primary: "Tiểu học",
  secondary: "THCS",
  high_school: "THPT",
};

export function TeacherClassDetailPage() {
  const { classId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getTeacherClassMembers(classId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
    const handleMembershipUpdate = (event) => {
      if (!event.detail?.classId || event.detail.classId === classId) load();
    };
    window.addEventListener("eduone:class-membership-updated", handleMembershipUpdate);
    return () => window.removeEventListener("eduone:class-membership-updated", handleMembershipUpdate);
  }, [classId, load]);

  async function invite(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.inviteStudentToClass(classId, studentEmail.trim().toLowerCase());
      setStudentEmail("");
      await load();
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function decide(membershipId, decision) {
    setActingId(membershipId);
    setError(null);
    try {
      await api.decideClassRequest(membershipId, decision);
      await load();
    } catch (decisionError) {
      setError(decisionError.message);
    } finally {
      setActingId(null);
    }
  }

  async function copyJoinCode() {
    await navigator.clipboard.writeText(data.class.joinCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading && !data) {
    return <div className="space-y-4"><div className="skeleton h-36" /><div className="skeleton h-72" /></div>;
  }

  return (
    <div className="space-y-5">
      <Link to="/teacher" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"><ArrowLeft size={17} />Tất cả lớp</Link>
      <FormAlert>{error}</FormAlert>

      {data && (
        <>
          <header className="surface p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="eyebrow">{data.class.subject?.steam_axis || "STEAM"} · {gradeLabels[data.class.gradeBand]}</p>
                <h1 className="mt-2 truncate text-2xl font-black md:text-3xl">{data.class.name}</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">{data.class.subject?.name || "Chưa chọn môn học"}</p>
                {data.class.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{data.class.description}</p>}
              </div>
              <div className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase text-emerald-700">Mã tham gia</p>
                <div className="mt-2 flex items-center gap-3">
                  <code className="text-xl font-black tracking-[0.16em] text-emerald-950">{data.class.joinCode}</code>
                  <button type="button" className="icon-button inline-grid bg-white" onClick={copyJoinCode} aria-label="Sao chép mã lớp" title="Sao chép mã lớp">{copied ? <Check size={18} /> : <Clipboard size={18} />}</button>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div><p className="eyebrow">Thành viên</p><h2 className="mt-1 text-lg font-black">Học sinh trong lớp</h2></div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{data.active.length}</span>
              </div>
              {data.active.length === 0 ? (
                <div className="px-5 py-12 text-center"><UserRound className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-bold text-slate-500">Chưa có học sinh trong lớp.</p></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.active.map((membership) => (
                    <div key={membership.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-100 font-black text-sky-800">{membership.student?.full_name?.charAt(0) || "H"}</div>
                      <div className="min-w-0"><p className="truncate text-sm font-black">{membership.student?.full_name || "Học sinh"}</p><p className="mt-1 truncate text-xs text-slate-500">{membership.student?.email}</p></div>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-black text-emerald-700"><UserCheck size={15} />Đang học</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <section className="surface p-5">
                <p className="eyebrow">Mời học sinh</p>
                <h2 className="mt-1 text-lg font-black">Gửi lời mời</h2>
                <form className="mt-5 space-y-4" onSubmit={invite}>
                  <FormField label="Email học sinh" type="email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="hocsinh@example.com" required />
                  <button type="submit" className="primary-button w-full" disabled={submitting || !studentEmail}><MailPlus size={17} />{submitting ? "Đang gửi..." : "Gửi lời mời"}</button>
                </form>
              </section>

              <section className="surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div><p className="eyebrow">Chờ xử lý</p><h2 className="mt-1 text-lg font-black">Yêu cầu & lời mời</h2></div>
                  <button type="button" className="icon-button inline-grid" onClick={load} aria-label="Làm mới" title="Làm mới"><RefreshCw size={18} /></button>
                </div>
                {data.pending.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm font-bold text-slate-400">Không có yêu cầu đang chờ.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.pending.map((membership) => (
                      <div key={membership.id} className="px-5 py-4">
                        <p className="truncate text-sm font-black">{membership.student?.full_name || membership.student?.email || "Học sinh"}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{membership.status === "requested" ? "Xin tham gia lớp" : "Đã gửi lời mời"}</p>
                        {membership.status === "requested" && (
                          <div className="mt-3 flex gap-2">
                            <button type="button" className="primary-button min-h-9 flex-1 px-3 text-xs" disabled={actingId === membership.id} onClick={() => decide(membership.id, "approve")}><Check size={15} />Duyệt</button>
                            <button type="button" className="secondary-button min-h-9 flex-1 px-3 text-xs" disabled={actingId === membership.id} onClick={() => decide(membership.id, "reject")}><X size={15} />Từ chối</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
