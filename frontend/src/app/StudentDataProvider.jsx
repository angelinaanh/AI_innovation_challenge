import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../lib/apiClient.js";
import { connectRealtime } from "../lib/realtimeClient.js";
import { useAuth } from "./AuthProvider.jsx";

const StudentDataContext = createContext(null);

export function StudentDataProvider({ children }) {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard(signal);
      setDashboard(data);
    } catch (loadError) {
      if (loadError.name !== "AbortError") {
        setError(loadError.message);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const socket = connectRealtime(session.access_token);
    socket.on("connect", () => setRealtimeStatus("connected"));
    socket.on("disconnect", () => setRealtimeStatus("offline"));
    socket.on("connect_error", () => setRealtimeStatus("offline"));
    socket.on("class.membership.updated", (detail) => {
      window.dispatchEvent(new CustomEvent("eduone:class-membership-updated", { detail }));
    });
    return () => socket.close();
  }, [session?.access_token]);

  const value = useMemo(
    () => ({
      dashboard,
      loading,
      error,
      realtimeStatus,
      retry: () => loadDashboard(),
    }),
    [dashboard, error, loadDashboard, loading, realtimeStatus],
  );

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const value = useContext(StudentDataContext);
  if (!value) {
    throw new Error("useStudentData must be used inside StudentDataProvider");
  }
  return value;
}
