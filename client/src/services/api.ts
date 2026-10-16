import { useAuthStore } from "@/store/auth";
import axios from "axios";

// In dev, use relative paths so Vite proxy handles routing (avoids CORS and
// localhost resolution failures on mobile). In production builds VITE_API_URL
// is set to the deployed backend URL.
const BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_URL ?? "") : "";

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  register: (data: {
    name: string;
    nickname: string;
    gender: string;
    height?: number;
    groupName: string;
    groupModes: string[];
    adminPassword: string;
  }) => api.post("/api/auth/register", data).then((r) => r.data),
  join: (data: {
    inviteCode: string;
    name: string;
    nickname: string;
    gender: string;
    height?: number;
  }) => api.post("/api/auth/join", data).then((r) => r.data),
  /** Admin login — existing player identified by nickname + invite code + password */
  login: (data: {
    inviteCode: string;
    nickname: string;
    adminPassword: string;
  }) => api.post("/api/auth/login", data).then((r) => r.data),
  getGroupByCode: (code: string) =>
    api.get(`/api/auth/group/${code}`).then((r) => r.data),
};

// Players
export const playersApi = {
  getMyGroup: () => api.get("/api/players").then((r) => r.data),
  getById: (id: string) => api.get(`/api/players/${id}`).then((r) => r.data),
  update: (id: string, data: any) =>
    api.patch(`/api/players/${id}`, data).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return api.post(`/api/players/${id}/photo`, form).then((r) => r.data);
  },
  getAffinities: (id: string) =>
    api.get(`/api/players/${id}/affinities`).then((r) => r.data),
  addAffinity: (id: string, targetId: string) =>
    api.post(`/api/players/${id}/affinity/${targetId}`).then((r) => r.data),
  removeAffinity: (id: string, targetId: string) =>
    api.delete(`/api/players/${id}/affinity/${targetId}`).then((r) => r.data),
};

// Groups
export const groupsApi = {
  getById: (id: string) => api.get(`/api/groups/${id}`).then((r) => r.data),
  update: (id: string, data: any) =>
    api.patch(`/api/groups/${id}`, data).then((r) => r.data),
  removePlayer: (groupId: string, playerId: string) =>
    api
      .delete(`/api/groups/${groupId}/players/${playerId}`)
      .then((r) => r.data),
  promoteModerator: (groupId: string, playerId: string) =>
    api
      .post(`/api/groups/${groupId}/moderators/${playerId}`)
      .then((r) => r.data),
  uploadEmblem: (groupId: string, file: File) => {
    const form = new FormData();
    form.append("emblem", file);
    return api.post(`/api/groups/${groupId}/emblem`, form).then((r) => r.data);
  },
};

// Rachas
export const rachasApi = {
  create: (data: { playerIds: string[]; type: string; script?: string }) =>
    api.post("/api/rachas", data).then((r) => r.data),
  listByGroup: (groupId: string) =>
    api.get(`/api/rachas/group/${groupId}`).then((r) => r.data),
  getById: (id: string) => api.get(`/api/rachas/${id}`).then((r) => r.data),
  finish: (id: string) =>
    api.post(`/api/rachas/${id}/finish`).then((r) => r.data),
  redraw: (id: string, script?: string) =>
    api.post(`/api/rachas/${id}/redraw`, { script }).then((r) => r.data),
};

// Matches
export const matchesApi = {
  create: (data: {
    rachaId: string;
    teamAPlayers: string[];
    teamBPlayers: string[];
    type: string;
  }) => api.post("/api/matches", data).then((r) => r.data),
  updateScore: (id: string, data: { team: "A" | "B"; score: number }) =>
    api.patch(`/api/matches/${id}/score`, data).then((r) => r.data),
  getById: (id: string) => api.get(`/api/matches/${id}`).then((r) => r.data),
};

// Rankings
export const rankingsApi = {
  players: (groupId?: string) =>
    api
      .get("/api/rankings/players", { params: { groupId } })
      .then((r) => r.data),
  duos: (groupId?: string) =>
    api.get("/api/rankings/duos", { params: { groupId } }).then((r) => r.data),
  topWinners: (groupId?: string) =>
    api
      .get("/api/rankings/top-winners", { params: { groupId } })
      .then((r) => r.data),
};

// Scripts
export const scriptsApi = {
  listByGroup: (groupId: string) =>
    api.get(`/api/scripts/group/${groupId}`).then((r) => r.data),
  create: (data: { name: string; code: string; isDefault?: boolean }) =>
    api.post("/api/scripts", data).then((r) => r.data),
  update: (id: string, data: any) =>
    api.patch(`/api/scripts/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/scripts/${id}`).then((r) => r.data),
  test: (data: { code: string; playerIds?: string[]; type?: string }) =>
    api.post("/api/scripts/test", data).then((r) => r.data),
  getTemplates: () => api.get("/api/scripts/templates").then((r) => r.data),
};

// Duos
export const duosApi = {
  listByGroup: (groupId: string) =>
    api.get(`/api/duos/group/${groupId}`).then((r) => r.data),
  getByPlayer: (playerId: string) =>
    api.get(`/api/duos/player/${playerId}`).then((r) => r.data),
  create: (data: { player1Id: string; player2Id: string; name?: string }) =>
    api.post("/api/duos", data).then((r) => r.data),
  update: (id: string, data: { name?: string; active?: boolean }) =>
    api.patch(`/api/duos/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/duos/${id}`).then((r) => r.data),
};
