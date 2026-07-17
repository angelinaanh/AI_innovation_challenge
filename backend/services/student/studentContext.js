export function throwDatabaseError(error, context) {
  if (!error) return;

  const wrapped = new Error(`Supabase query failed: ${context}`);
  wrapped.code = "DATABASE_ERROR";
  wrapped.cause = error;
  throw wrapped;
}

export async function resolveStudentId(requestedStudentId) {
  if (!requestedStudentId) {
    const missing = new Error("Authenticated student identity is required.");
    missing.code = "AUTH_REQUIRED";
    throw missing;
  }
  return requestedStudentId;
}
