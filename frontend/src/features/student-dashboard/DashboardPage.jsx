import { useState } from "react";
import { ArrowRight, BookOpenCheck, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { OnboardingGate } from "../../features/onboarding/OnboardingGate.jsx";

import { useStudentData } from "../../app/StudentDataProvider.jsx";
import { BadgeShelf } from "./BadgeShelf.jsx";
import { DueAssessmentBanner } from "./DueAssessmentBanner.jsx";
import { InProgressSubjects } from "./InProgressSubjects.jsx";
import { MetricCards } from "./MetricCards.jsx";
import { RadarProfile } from "./RadarProfile.jsx";
import { WeekActivity } from "./WeekActivity.jsx";

function DashboardLoading() {
  return (
    <div className="space-y-4" aria-label="Đang tải dashboard">
      <div className="skeleton h-[248px] rounded-[28px]" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="skeleton h-28" /><div className="skeleton h-28" /><div className="skeleton h-28" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="skeleton h-96" /><div className="skeleton h-96" />
      </div>
    </div>
  );
}

function DashboardError({ message, retry }) {
  return (
    <div className="surface mx-auto mt-16 max-w-xl p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <RefreshCw size={22} />
      </div>
      <h1 className="mt-4 text-xl font-black">Chưa tải được hành trình học</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
      <button className="primary-button mt-5" onClick={retry}>
        <RefreshCw size={17} /> Thử lại
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { dashboard, loading, error, retry } = useStudentData();
  const [showGate, setShowGate] = useState(false);

  if (loading) return <DashboardLoading />;
  if (error || !dashboard) return <DashboardError message={error} retry={retry} />;

  const firstName = dashboard.student.fullName.split(" ")[0];
  const recommendation = dashboard.recommendation;
  const onboarding = dashboard?.onboarding;
  const needsOnboarding = Boolean(dashboard) && onboarding && !onboarding.placementCompleted;

  if (needsOnboarding) {
    return (
      <div className="space-y-4 md:space-y-5">
        <section className="quest-hero" aria-labelledby="welcome-title">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white/90">
              <Sparkles size={17} aria-hidden="true" /> Bước khởi đầu quan trọng
            </div>
            <h1 id="welcome-title" className="mt-3 max-w-2xl text-3xl font-black leading-tight text-white md:text-[40px]">
              Chào {firstName}, hãy làm Bài kiểm tra năng lực đầu vào!
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/90 md:text-base">
              Hệ thống cần hiểu rõ thế mạnh của bạn để cá nhân hóa lộ trình học tập tối ưu nhất.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button className="hero-button" onClick={() => setShowGate(true)}>
                Bắt đầu làm bài <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="quest-symbol" aria-hidden="true">
            <ShieldCheck size={68} strokeWidth={1.8} />
          </div>
        </section>

        {showGate && (
          <OnboardingGate onboarding={onboarding} onFinished={() => { setShowGate(false); retry(); }} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="quest-hero" aria-labelledby="welcome-title">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white/90">
            <Sparkles size={17} aria-hidden="true" /> Nhiệm vụ phù hợp nhất hôm nay
          </div>
          <h1 id="welcome-title" className="mt-3 max-w-2xl text-3xl font-black leading-tight text-white md:text-[40px]">
            Chào {firstName}, sẵn sàng chinh phục {recommendation?.name || "thử thách mới"}?
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/90 md:text-base">
            {recommendation?.unlockReason || "EduOne đang phân tích hồ sơ STEAM để chọn bước tiếp theo."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={recommendation ? `/student/lessons/${recommendation.id}` : "/student/path"}
              className="hero-button"
            >
              Bắt đầu học <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-white/90">
              <ShieldCheck size={16} /> Lộ trình dùng luật minh bạch
            </div>
          </div>
        </div>
        <div className="quest-symbol" aria-hidden="true">
          <BookOpenCheck size={68} strokeWidth={1.8} />
        </div>
      </section>

      <DueAssessmentBanner />

      <MetricCards dashboard={dashboard} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <RadarProfile profile={dashboard.steamProfile} proficiency={dashboard.onboarding?.proficiency} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <InProgressSubjects grade={Number(dashboard.student?.gradeLevel) || 9} />
          <WeekActivity days={dashboard.weekActivity} />
          <BadgeShelf badges={dashboard.badges} />
        </div>
      </div>
    </div>
  );
}
