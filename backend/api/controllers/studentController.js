import {
  getStudentDashboard,
  getStudentPath,
} from "../../services/student/studentDashboardService.js";
import {
  getPublishedLesson,
  submitQuizAttempt,
} from "../../services/learning/learningService.js";

export async function dashboard(request, response, next) {
  try {
    const data = await getStudentDashboard(request.auth.profile.id);
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function path(request, response, next) {
  try {
    const data = await getStudentPath(request.auth.profile.id);
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function lesson(request, response, next) {
  try {
    const data = await getPublishedLesson(
      request.auth.profile.id,
      request.params.skillNodeId,
    );
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function attempt(request, response, next) {
  try {
    const data = await submitQuizAttempt(request.auth.profile.id, request.body);
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}
