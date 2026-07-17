import { env } from "../../utils/env.js";
import { supabase } from "../supabase.js";

export function throwDatabaseError(error, context) {
  if (!error) return;

  const wrapped = new Error(`Supabase query failed: ${context}`);
  wrapped.code = "DATABASE_ERROR";
  wrapped.cause = error;
  throw wrapped;
}

export async function resolveStudentId(requestedStudentId) {
  const configuredId = requestedStudentId || env.demoStudentId;
  if (configuredId) return configuredId;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(error, "resolve demo student");

  if (!data) {
    const missing = new Error("No student profile exists. Run npm run seed:demo first.");
    missing.code = "DEMO_DATA_MISSING";
    throw missing;
  }
  return data.id;
}
