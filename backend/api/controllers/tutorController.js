import {
  createOrResumeTutorSession,
  escalateTutorMessage,
  streamTutorMessage,
} from "../../services/tutor/tutorService.js";
import { encodeSse } from "../../services/tutor/tutorRules.js";

function requestedStudentId(request) {
  return request.header("x-demo-student-id") || null;
}

export async function createSession(request, response, next) {
  try {
    const data = await createOrResumeTutorSession(
      requestedStudentId(request),
      request.body?.skillNodeId,
    );
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function streamMessage(request, response) {
  response.status(200);
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();

  let aborted = false;
  request.on("aborted", () => {
    aborted = true;
  });
  response.on("close", () => {
    if (!response.writableEnded) aborted = true;
  });
  const emit = (event, data) => {
    if (!aborted && !response.writableEnded) response.write(encodeSse(event, data));
  };

  try {
    await streamTutorMessage({
      requestedStudentId: requestedStudentId(request),
      sessionId: request.params.sessionId,
      rawMessage: request.body?.message,
      emit,
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      requestId: request.requestId,
      code: error.code || "TUTOR_STREAM_ERROR",
      message: error.message,
    }));
    emit("error", {
      code: error.code || "TUTOR_STREAM_ERROR",
      message: ["VALIDATION_ERROR", "TUTOR_SESSION_NOT_FOUND"].includes(error.code)
        ? error.message
        : "AI Tutor đang gặp sự cố. Vui lòng thử lại hoặc gửi câu hỏi cho giáo viên.",
      requestId: request.requestId,
    });
  } finally {
    if (!aborted && !response.writableEnded) response.end();
  }
}

export async function escalate(request, response, next) {
  try {
    const data = await escalateTutorMessage(
      requestedStudentId(request),
      request.params.messageId,
    );
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}
