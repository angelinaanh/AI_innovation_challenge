import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { api } from "../lib/apiClient.js";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState(null);
  const hydrationId = useRef(0);

  const hydrate = useCallback(async (nextSession) => {
    const currentHydration = hydrationId.current + 1;
    hydrationId.current = currentHydration;
    setSession(nextSession);
    setError(null);

    if (!nextSession) {
      setAccount(null);
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextAccount = await api.getMe(undefined, nextSession.access_token);
      if (hydrationId.current !== currentHydration) return;
      setAccount(nextAccount);
      setNeedsOnboarding(false);
    } catch (loadError) {
      if (hydrationId.current !== currentHydration) return;
      if (loadError.code === "PROFILE_ONBOARDING_REQUIRED") {
        setAccount(null);
        setNeedsOnboarding(true);
      } else {
        setError(loadError.message);
        setAccount(null);
      }
    } finally {
      if (hydrationId.current === currentHydration) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      hydrate(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => {
        if (mounted) hydrate(nextSession);
      });
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrate]);

  const completeOnboarding = useCallback(async (profile, explicitSession = session) => {
    if (!explicitSession) throw new Error("Phiên đăng nhập không còn hiệu lực.");
    const nextAccount = await api.bootstrapAccount(
      profile,
      undefined,
      explicitSession.access_token,
    );
    setSession(explicitSession);
    setAccount(nextAccount);
    setNeedsOnboarding(false);
    return nextAccount;
  }, [session]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    account,
    loading,
    error,
    needsOnboarding,
    refreshAccount: () => hydrate(session),
    completeOnboarding,
    signOut: () => supabase.auth.signOut({ scope: "local" }),
  }), [
    account,
    completeOnboarding,
    error,
    hydrate,
    loading,
    needsOnboarding,
    session,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
