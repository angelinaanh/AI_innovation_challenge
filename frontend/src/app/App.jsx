import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StudentShell } from "../components/layout/StudentShell.jsx";
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
              <Route path="/student/lessons/:skillNodeId" element={<LessonPlayerPage />} />
            </Route>
          </Route>

          {[
            ["teacher", "/teacher"],
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
