import http from "node:http";

import { Server } from "socket.io";

import { createApp } from "./app.js";
import { env } from "./utils/env.js";

const httpServer = http.createServer(createApp());
const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.emit("system.ready", {
    connectedAt: new Date().toISOString(),
  });
});

httpServer.listen(env.port, () => {
  console.log(`EduOne API listening on http://localhost:${env.port}`);
});
