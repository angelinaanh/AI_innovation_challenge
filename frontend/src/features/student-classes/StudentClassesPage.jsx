import {
  Check,
  DoorOpen,
  GraduationCap,
  MailCheck,
  School,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { gradeLabel } from "../../lib/academicCatalog.js";
import { api } from "../../lib/apiClient.js";
import { FormAlert, FormField } from "../auth/AuthFormControls.jsx";

export function StudentClassesPage() {
  const [classes, setClasses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classRows, inviteRows] = await Promise.all([
        api.getStudentClasses(),
        api.getStudentInvitations(),
      ]);
      setClasses(classRows);
      setInvitations(inviteRows);
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

  async function requestJoin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.requestClassJoin(joinCode.trim().toUpperCase());
      setJoinCode("");
      setMessage(result.status === "active" ? `Bạn đã vào lớp ${result.className}.` : `Đã gửi yêu cầu tới lớp ${result.className}.`);
      await load();
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function respond(membershipId, response) {
    setActingId(membershipId);
    setError(null);
    setMessage(null);
    try {
      await api.respondToClassInvite(membershipId, response);
      setMessage(response === "accept" ? "Đã tham gia lớp học." : "Đã từ chối lời mời.");
      await load();
    } catch (responseError) {
      setError(responseError.message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Cộng tác học tập</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Lớp học của tôi</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">Tham gia lớp bằng mã hoặc phản hồi lời mời từ giáo viên.</p>
      </header>

      <FormAlert>{error}</FormAlert>
      <FormAlert tone="success">{message}</FormAlert>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(320px,0.65fr)_minmax(0,1.35fr)]">
        <div className="space-y-5">
          <div className="surface p-5">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><DoorOpen size={21} /></div>
            <h2 className="mt-4 text-lg font-black">Tham gia bằng mã lớp</h2>
            <form className="mt-5 space-y-4" onSubmit={requestJoin}>
              <FormField label="Mã lớp" value={joinCode} maxLength={8} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ABC234" required />
              <button type="submit" className="primary-button w-full" disabled={submitting || !joinCode}><GraduationCap size={17} />{submitting ? "Đang gửi..." : "Xin tham gia"}</button>
            </form>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4"><p className="eyebrow">Lời mời</p><h2 className="mt-1 text-lg font-black">Đang chờ phản hồi</h2></div>
            {loading ? <div className="skeleton m-5 h-28" /> : invitations.length === 0 ? (
              <div className="px-5 py-10 text-center"><MailCheck className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-bold text-slate-400">Không có lời mời mới.</p></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invitations.map((invite) => (
                  <div key={invite.membershipId} className="px-5 py-4">
                    <p className="text-sm font-black">{invite.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{invite.subject?.name || "STEAM"} · {invite.teacher?.full_name || "Giáo viên"}</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" className="primary-button min-h-9 flex-1 px-3 text-xs" disabled={actingId === invite.membershipId} onClick={() => respond(invite.membershipId, "accept")}><Check size={15} />Chấp nhận</button>
                      <button type="button" className="secondary-button min-h-9 flex-1 px-3 text-xs" disabled={actingId === invite.membershipId} onClick={() => respond(invite.membershipId, "decline")}><X size={15} />Từ chối</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section aria-labelledby="my-class-list">
          <div className="mb-3 flex items-center justify-between"><h2 id="my-class-list" className="section-title">Lớp đang tham gia</h2><span className="text-xs font-bold text-slate-400">{classes.length} lớp</span></div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="skeleton h-44" />)}</div>
          ) : classes.length === 0 ? (
            <div className="surface px-6 py-14 text-center"><School className="mx-auto text-slate-300" size={36} /><h3 className="mt-4 text-lg font-black">Bạn chưa tham gia lớp nào</h3></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((item) => (
                <article key={item.id} className="surface min-h-44 p-5">
                  <div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-100 text-sky-800"><School size={21} /></div><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{item.subject?.steam_axis || "STEAM"}</span></div>
                  <h3 className="mt-4 truncate text-lg font-black">{item.name}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">{item.subject?.name || "Chưa chọn môn"} · {gradeLabel(item.gradeLevel)}</p>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">{item.teacher?.full_name || "Giáo viên phụ trách"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
