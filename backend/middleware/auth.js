import {
  accountFromIdentity,
  authenticateAccessToken,
} from "../services/auth/authService.js";
import { isLearningAccountActive } from "../services/auth/authRules.js";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function bearerToken(request) {
  const authorization = request.header("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function authenticateRequest(request, _response, next) {
  try {
    request.auth = await authenticateAccessToken(bearerToken(request));
    next();
  } catch (error) {
    next(error);
  }
}

export function requireProfile(request, _response, next) {
  if (!request.auth?.profile) {
    next(appError(
      "PROFILE_ONBOARDING_REQUIRED",
      "Bạn cần hoàn tất hồ sơ trước khi tiếp tục.",
    ));
    return;
  }
  request.auth.account = accountFromIdentity(
    request.auth.user,
    request.auth.profile,
  );
  next();
}

export function requireRole(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.auth?.profile || !allowedRoles.includes(request.auth.profile.role)) {
      next(appError("AUTH_FORBIDDEN", "Bạn không có quyền truy cập chức năng này."));
      return;
    }
    next();
  };
}

export function requireActiveAccount(request, _response, next) {
  const status = request.auth?.account?.accountStatus;
  if (status === "PENDING") {
    next(appError(
      "GUARDIAN_CONSENT_REQUIRED",
      "Tài khoản đang chờ xác nhận của người giám hộ.",
    ));
    return;
  }
  if (!isLearningAccountActive(status)) {
    next(appError("ACCOUNT_INACTIVE", "Tài khoản hiện không hoạt động."));
    return;
  }
  next();
}
