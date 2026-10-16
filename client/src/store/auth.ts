import type { Group, Player } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  player: Player | null;
  group: Group | null;
  role: "admin" | "moderator" | "player" | null;
  setAuth: (
    token: string,
    player: Player,
    group: Group,
    role: "admin" | "moderator" | "player",
  ) => void;
  logout: () => void;
  updatePlayer: (player: Player) => void;
  updateGroup: (group: Group) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      player: null,
      group: null,
      role: null,
      setAuth: (token, player, group, role) =>
        set({ token, player, group, role }),
      logout: () => set({ token: null, player: null, group: null, role: null }),
      updatePlayer: (player) => set({ player }),
      updateGroup: (group) => set({ group }),
    }),
    { name: "racha-auth" },
  ),
);
