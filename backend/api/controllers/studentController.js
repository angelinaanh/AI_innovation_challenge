import {
  getStudentDashboard,
  getStudentPath,
} from "../../services/student/studentDashboardService.js";

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
