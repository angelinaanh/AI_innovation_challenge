import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { AuthLoadingScreen } from "./AuthLoadingScreen.jsx";

export function PublicOnlyRoute() {
  const { session, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return session ? <Navigate to="/" replace /> : <Outlet />;
}

export function OnboardingRoute() {
  const { session, account, needsOnboarding, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (account && !needsOnboarding) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function ProtectedRoute({ roles }) {
  const { session, account, needsOnboarding, loading, error } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoadingScreen />;
  if (!session) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  if (error || !account) return <Navigate to="/auth-error" replace />;
  if (account.accountStatus === "PENDING") return <Navigate to="/account-pending" replace />;
  if (!account.learningAccess) return <Navigate to="/account-inactive" replace />;
  if (roles && !roles.includes(account.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function SessionRoute() {
  const { session, needsOnboarding, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RootRedirect() {
  const { session, account, needsOnboarding, loading, error } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  if (error || !account) return <Navigate to="/auth-error" replace />;
  if (account?.accountStatus === "PENDING") return <Navigate to="/account-pending" replace />;
  if (!account?.learningAccess) return <Navigate to="/account-inactive" replace />;
  if (account.role === "student") return <Navigate to="/student" replace />;
  if (["teacher", "parent", "admin"].includes(account.role)) return <Navigate to={`/${account.role}`} replace />;
  return <Navigate to="/unauthorized" replace />;
}
