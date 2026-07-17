import { io } from "socket.io-client";

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || "http://localhost:4000";

export function connectRealtime() {
  return io(REALTIME_URL, {
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 5000,
  });
}
