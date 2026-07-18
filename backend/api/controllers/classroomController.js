import {
  createClass,
  decideRequest,
  getClassMembers,
  inviteStudent,
  listInvitations,
  listStudentClasses,
  listSubjects,
  listTeacherClasses,
  requestJoin,
  respondInvite,
} from "../../services/classroom/classroomService.js";

const uid = (request) => request.auth?.profile?.id;

export async function getSubjects(request, response, next) {
  try {
    response.json({ data: await listSubjects(uid(request), request.query.gradeLevel) });
  } catch (error) { next(error); }
}

// -- Teacher --
export async function postClass(request, response, next) {
  try {
    const data = await createClass(uid(request), {
      name: request.body?.name,
      gradeLevel: request.body?.gradeLevel,
      subjectId: request.body?.subjectId,
      description: request.body?.description,
    });
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function getClasses(request, response, next) {
  try { response.json({ data: await listTeacherClasses(uid(request)) }); }
  catch (error) { next(error); }
}

export async function getMembers(request, response, next) {
  try { response.json({ data: await getClassMembers(uid(request), request.params.classId) }); }
  catch (error) { next(error); }
}

export async function postInvite(request, response, next) {
  try {
    const data = await inviteStudent(uid(request), request.params.classId, request.body?.studentEmail);
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function postDecision(request, response, next) {
  try {
    const data = await decideRequest(uid(request), request.params.membershipId, request.body?.decision);
    response.json({ data });
  } catch (error) { next(error); }
}

// -- Student --
export async function getMyClasses(request, response, next) {
  try { response.json({ data: await listStudentClasses(uid(request)) }); }
  catch (error) { next(error); }
}

export async function getInvitations(request, response, next) {
  try { response.json({ data: await listInvitations(uid(request)) }); }
  catch (error) { next(error); }
}

export async function postJoin(request, response, next) {
  try {
    const data = await requestJoin(uid(request), request.body?.joinCode);
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function postRespond(request, response, next) {
  try {
    const data = await respondInvite(uid(request), request.params.membershipId, request.body?.response);
    response.json({ data });
  } catch (error) { next(error); }
}
