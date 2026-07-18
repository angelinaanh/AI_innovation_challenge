export function friendlyAuthError(error) {
  const message = String(error?.message || "");
  if (/invalid login credentials/i.test(message)) {
    return "Email hoặc mật khẩu chưa đúng.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Email chưa được xác nhận. Hãy kiểm tra hộp thư của bạn.";
  }
  if (/user already registered/i.test(message)) {
    return "Email này đã có tài khoản. Hãy đăng nhập hoặc đặt lại mật khẩu.";
  }
  if (/password should be/i.test(message)) {
    return "Mật khẩu chưa đáp ứng yêu cầu bảo mật.";
  }
  if (/rate limit/i.test(message)) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  }
  return message || "Không thể hoàn tất yêu cầu lúc này.";
}

export function ageFromDate(dateOfBirth, today = new Date()) {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function safeReturnPath(value) {
  return typeof value === "string"
    && /^\/(?!\/)[^\\\u0000-\u001f]*$/.test(value)
    ? value
    : "/";
}

export function returnPathForRole(value, role) {
  const path = safeReturnPath(value);
  const roleRoot = ["student", "teacher", "parent", "admin"].includes(role)
    ? `/${role}`
    : null;
  return roleRoot && (path === roleRoot || path.startsWith(`${roleRoot}/`))
    ? path
    : "/";
}
