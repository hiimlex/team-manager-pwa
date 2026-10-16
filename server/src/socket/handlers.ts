import { Server } from "socket.io";
import { AuthPayload, verifyToken } from "../middleware/auth.js";

export function registerSocketHandlers(io: Server) {
  // Require a valid JWT on the handshake (client sends `auth: { token }`)
  io.use((socket, next) => {
    try {
      socket.data.auth = verifyToken(String(socket.handshake.auth?.token));
      next();
    } catch {
      next(new Error("Não autorizado"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth as AuthPayload;

    // Join a group room to receive real-time scoreboard updates.
    // Only the group bound to the token can be joined.
    socket.on("join:group", (groupId: string) => {
      if (groupId === auth.groupId) socket.join(groupId);
    });

    socket.on("leave:group", (groupId: string) => {
      socket.leave(groupId);
    });

    socket.on("disconnect", () => {
      // cleanup handled by Socket.io automatically
    });
  });
}
