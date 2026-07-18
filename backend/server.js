import http from "node:http";

import { Server } from "socket.io";

import { createApp } from "./app.js";
import { authenticateAccessToken } from "./services/auth/authService.js";
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

io.use(async (socket, next) => {
  try {
    const auth = await authenticateAccessToken(socket.handshake.auth?.accessToken);
    if (!auth.profile) {
      const error = new Error("Profile onboarding is required.");
      error.data = { code: "PROFILE_ONBOARDING_REQUIRED" };
      next(error);
      return;
    }
    if (!auth.account?.learningAccess) {
      const error = new Error("Account is not active.");
      error.data = {
        code: auth.account?.accountStatus === "PENDING"
          ? "GUARDIAN_CONSENT_REQUIRED"
          : "ACCOUNT_INACTIVE",
      };
      next(error);
      return;
    }
    socket.data.auth = auth;
    next();
  } catch (cause) {
    const error = new Error("Authentication failed.");
    error.data = { code: cause.code || "AUTH_INVALID" };
    next(error);
  }
});

io.on("connection", (socket) => {
  const { profile } = socket.data.auth;
  socket.join(`user:${profile.id}`);
  socket.join(`org:${profile.org_id}`);
  if (profile.role === "teacher") socket.join(`teacher:${profile.id}`);
  if (profile.role === "admin") socket.join(`admin:${profile.org_id}`);
  socket.emit("system.ready", {
    connectedAt: new Date().toISOString(),
  });
});

httpServer.listen(env.port, () => {
  console.log(`EduOne API listening on http://localhost:${env.port}`);
});
