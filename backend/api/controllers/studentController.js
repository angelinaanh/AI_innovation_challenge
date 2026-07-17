import {
  getStudentDashboard,
  getStudentPath,
} from "../../services/student/studentDashboardService.js";
import {
  getPublishedLesson,
  submitQuizAttempt,
} from "../../services/learning/learningService.js";

function requestedStudentId(request) {
  return request.header("x-demo-student-id") || null;
}

export async function dashboard(request, response, next) {
  try {
    const data = await getStudentDashboard(requestedStudentId(request));
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function path(request, response, next) {
  try {
    const data = await getStudentPath(requestedStudentId(request));
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function lesson(request, response, next) {
  try {
    const data = await getPublishedLesson(
      requestedStudentId(request),
      request.params.skillNodeId,
    );
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function attempt(request, response, next) {
  try {
    const data = await submitQuizAttempt(requestedStudentId(request), request.body);
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}
