import { useAuthStore } from "@/store/auth";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// In dev the Vite proxy tunnels /socket.io → backend, so connect to current
// page origin. In production use the explicit backend URL.
const SOCKET_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_SOCKET_URL ?? window.location.origin)
  : window.location.origin;

export function useSocket() {
  const { token, group } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !group) return;

    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token },
        path: "/socket.io",
      });
    }

    socketRef.current = socket;
    socket.emit("join:group", group._id);

    return () => {
      socket?.emit("leave:group", group._id);
    };
  }, [token, group]);

  return socketRef.current;
}
