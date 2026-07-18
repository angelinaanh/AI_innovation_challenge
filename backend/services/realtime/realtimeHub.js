let realtimeServer = null;

export function setRealtimeServer(server) {
  realtimeServer = server;
}

export function emitTutorEscalated(payload) {
  if (!realtimeServer) return;
  if (payload.assignedTeacherId) {
    realtimeServer.to(`teacher:${payload.assignedTeacherId}`).emit("tutor.escalated", payload);
  }
}

export function emitClassMembershipUpdated(payload) {
  if (!realtimeServer) return;
  if (payload.teacherId) {
    realtimeServer.to(`teacher:${payload.teacherId}`).emit("class.membership.updated", payload);
  }
  if (payload.studentId) {
    realtimeServer.to(`user:${payload.studentId}`).emit("class.membership.updated", payload);
  }
}
