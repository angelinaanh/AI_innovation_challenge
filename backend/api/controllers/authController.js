import { bootstrapStudentAccount } from "../../services/auth/authService.js";

export async function bootstrap(request, response, next) {
  try {
    const data = await bootstrapStudentAccount(request.auth, request.body || {});
    response.status(request.auth.profile ? 200 : 201).json({ data });
  } catch (error) {
    next(error);
  }
}

export function me(request, response) {
  response.json({ data: request.auth.account });
}
