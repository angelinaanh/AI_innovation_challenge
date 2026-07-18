import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StudentShell } from "../components/layout/StudentShell.jsx";
import { TeacherShell } from "../components/layout/TeacherShell.jsx";
import {
  AuthUnavailablePage,
  InactiveAccountPage,
  PendingAccountPage,
  RoleWorkspacePage,
  UnauthorizedPage,
} from "../features/auth/AccountStatePage.jsx";
import { AuthCallbackPage } from "../features/auth/AuthCallbackPage.jsx";
import {
  OnboardingRoute,
  ProtectedRoute,
  PublicOnlyRoute,
  RootRedirect,
  SessionRoute,
} from "../features/auth/AuthGuards.jsx";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage.jsx";
import { LoginPage } from "../features/auth/LoginPage.jsx";
import { OnboardingPage } from "../features/auth/OnboardingPage.jsx";
import { RegisterPage } from "../features/auth/RegisterPage.jsx";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage.jsx";
import { DashboardPage } from "../features/student-dashboard/DashboardPage.jsx";
import { LearningPathPage } from "../features/learning-path/LearningPathPage.jsx";
import { LessonPlayerPage } from "../features/lesson-player/LessonPlayerPage.jsx";
import { StudentClassesPage } from "../features/student-classes/StudentClassesPage.jsx";
import { StudentContentPage } from "../features/student-content/StudentContentPage.jsx";
import { SoftSkillLessonPage } from "../features/student-content/SoftSkillLessonPage.jsx";
import {
  StudentAiLessonDetailPage,
  StudentAiLessonsPage,
} from "../features/student-content/StudentAiLessonsPage.jsx";
import { TeacherAiLessonsPage } from "../features/teacher-content/TeacherAiLessonsPage.jsx";
import { TeacherLessonGeneratorPage } from "../features/teacher-content/TeacherLessonGeneratorPage.jsx";
import { TeacherClassDetailPage } from "../features/teacher/TeacherClassDetailPage.jsx";
import { TeacherClassesPage } from "../features/teacher/TeacherClassesPage.jsx";
import { CommunityHubPage } from "../features/community/CommunityHubPage.jsx";
import { CommunityPostDetailPage } from "../features/community/CommunityPostDetailPage.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import { StudentDataProvider } from "./StudentDataProvider.jsx";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<SessionRoute />}>
            <Route path="/auth-error" element={<AuthUnavailablePage />} />
            <Route path="/account-pending" element={<PendingAccountPage />} />
            <Route path="/account-inactive" element={<InactiveAccountPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route element={<StudentDataProvider><StudentShell /></StudentDataProvider>}>
              <Route path="/student" element={<DashboardPage />} />
              <Route path="/student/path" element={<LearningPathPage />} />
              <Route path="/student/content" element={<StudentContentPage />} />
              <Route path="/student/soft-skills/:id" element={<SoftSkillLessonPage />} />
              <Route path="/student/ai-lessons" element={<StudentAiLessonsPage />} />
              <Route path="/student/ai-lessons/:lessonId" element={<StudentAiLessonDetailPage />} />
              <Route path="/student/classes" element={<StudentClassesPage />} />
              <Route path="/student/community" element={<CommunityHubPage />} />
              <Route path="/student/community/:id" element={<CommunityPostDetailPage />} />
              <Route path="/student/lessons/:skillNodeId" element={<LessonPlayerPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["teacher"]} />}>
            <Route element={<TeacherShell />}>
              <Route path="/teacher" element={<TeacherClassesPage />} />
              <Route path="/teacher/classes/:classId" element={<TeacherClassDetailPage />} />
              <Route path="/teacher/ai-lessons" element={<TeacherLessonGeneratorPage />} />
              <Route path="/teacher/ai-lessons/library" element={<TeacherAiLessonsPage />} />
              <Route path="/teacher/community" element={<CommunityHubPage />} />
              <Route path="/teacher/community/:id" element={<CommunityPostDetailPage />} />

            </Route>
          </Route>

          {[
            ["parent", "/parent"],
            ["admin", "/admin"],
          ].map(([role, path]) => (
            <Route key={role} element={<ProtectedRoute roles={[role]} />}>
              <Route path={path} element={<RoleWorkspacePage />} />
            </Route>
          ))}

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
