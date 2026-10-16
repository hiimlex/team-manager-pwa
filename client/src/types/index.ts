export interface PlayerStats {
  setting: number;
  passing: number;
  attack: number;
  blocking: number;
  physical: number;
  technique: number;
  gameVision: number;
}

export interface PlayerAffinity {
  player: Player | string;
  wins: number;
  total: number;
  winRate: number;
}

export type Position =
  | "setter"
  | "outside"
  | "middle"
  | "opposite"
  | "libero"
  | "universal";
export type Gender = "M" | "F";
export type MatchType = "quartet" | "doubles";

export interface Player {
  _id: string;
  name: string;
  nickname: string;
  photo?: string;
  age?: number;
  height?: number;
  gender: Gender;
  position: Position;
  stats: PlayerStats;
  overall: number;
  affinities: PlayerAffinity[];
  wins: number;
  losses: number;
  matchesPlayed: number;
  rachasPlayed: number;
  groups: string[];
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  emblem?: string;
  admin: string | Player;
  moderators: string[];
  players: string[] | Player[];
  inviteCode: string;
  /** Supported match modes for this group */
  modes: MatchType[];
  defaultScript?: string;
  createdAt: string;
}

export interface Duo {
  _id: string;
  group: string;
  players: [Player, Player];
  name: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  active: boolean;
  createdAt: string;
}

export interface Match {
  _id: string;
  rachaSession: string;
  group: string;
  date: string;
  type: MatchType;
  teamA: { players: string[] | Player[]; score: number };
  teamB: { players: string[] | Player[]; score: number };
  winner?: "A" | "B";
  status: "ongoing" | "finished";
  duration?: number;
}

export interface RachaSession {
  _id: string;
  group: string;
  date: string;
  type: MatchType;
  players: string[] | Player[];
  matches: string[] | Match[];
  status: "active" | "finished";
  drawScript?: string;
  teams?: string[][];
  createdAt: string;
}

export interface DrawScript {
  _id: string;
  group: string;
  name: string;
  code: string;
  isDefault: boolean;
  createdBy: string | Player;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  player: Player | null;
  group: Group | null;
  role: "admin" | "moderator" | "player" | null;
}

export interface RankingPlayer extends Player {
  winRate: number;
}

export interface DuoRanking {
  players: [Player, Player];
  wins: number;
  total: number;
  winRate: number;
}
