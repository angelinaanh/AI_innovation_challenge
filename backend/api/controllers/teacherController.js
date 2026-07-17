import { listTutorEscalations } from "../../services/tutor/tutorService.js";

export async function escalations(request, response, next) {
  try {
    const data = await listTutorEscalations(
      request.header("x-demo-teacher-id") || null,
    );
    response.json({ data });
  } catch (error) {
    next(error);
  }
}
