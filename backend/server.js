import http from "node:http";

import { Server } from "socket.io";

import { createApp } from "./app.js";
import { setRealtimeServer } from "./services/realtime/realtimeHub.js";
import { env } from "./utils/env.js";

const httpServer = http.createServer(createApp());
const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigins,
    credentials: true,
  },
});
setRealtimeServer(io);

io.on("connection", (socket) => {
  const teacherId = socket.handshake.auth?.teacherId;
  const userId = socket.handshake.auth?.userId;
  if (teacherId) socket.join(`teacher:${teacherId}`);
  if (userId) socket.join(`user:${userId}`);
  socket.emit("system.ready", {
    connectedAt: new Date().toISOString(),
  });
});

httpServer.listen(env.port, () => {
  console.log(`EduOne API listening on http://localhost:${env.port}`);
});
