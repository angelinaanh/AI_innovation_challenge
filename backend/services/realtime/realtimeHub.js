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
