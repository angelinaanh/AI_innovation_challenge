import {
  generateExercise,
  listExerciseProposals,
  promoteExercise,
  reviewExerciseProposal,
  submitExercise,
} from "../../services/tutor/exerciseService.js";

// Identity is read defensively so these endpoints work both under the real
// auth middleware (request.auth.profile.id) and in local demo mode (header /
// first-profile fallback), matching the existing Tutor controllers.
function studentIdFrom(request) {
  return request.auth?.profile?.id || request.header("x-demo-student-id") || null;
}

function teacherIdFrom(request) {
  return request.auth?.profile?.id || request.header("x-demo-teacher-id") || null;
}

export async function createExercise(request, response, next) {
  try {
    const data = await generateExercise({
      requestedStudentId: studentIdFrom(request),
      sessionId: request.body?.sessionId,
      type: request.body?.type,
    });
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function submitExerciseAttempt(request, response, next) {
  try {
    const data = await submitExercise({
      requestedStudentId: studentIdFrom(request),
      exerciseId: request.params.exerciseId,
      response: request.body?.response,
    });
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function promoteExerciseToTeacher(request, response, next) {
  try {
    const data = await promoteExercise({
      requestedStudentId: studentIdFrom(request),
      exerciseId: request.params.exerciseId,
    });
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function exerciseProposals(request, response, next) {
  try {
    const data = await listExerciseProposals(teacherIdFrom(request));
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function reviewProposal(request, response, next) {
  try {
    const data = await reviewExerciseProposal({
      requestedTeacherId: teacherIdFrom(request),
      exerciseId: request.params.exerciseId,
      decision: request.body?.decision,
    });
    response.json({ data });
  } catch (error) {
    next(error);
  }
}
