import { Request, Response, Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Match } from "../models/Match.js";
import { Player } from "../models/Player.js";

export const rankingsRouter = Router();

// GET /api/rankings/players?period=all|month|week
rankingsRouter.get(
  "/players",
  authenticate,
  async (req: Request, res: Response) => {
    // Always scoped to the caller's group (query groupId is ignored)
    const { groupId } = req.auth!;

    const players = await Player.find({ groups: groupId })
      .sort({ wins: -1, overall: -1 })
      .limit(20)
      .select(
        "name nickname photo overall wins losses matchesPlayed position gender",
      );

    const withWinRate = players.map((p) => ({
      ...p.toObject(),
      winRate:
        p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0,
    }));

    res.json(withWinRate);
  },
);

// GET /api/rankings/duos
rankingsRouter.get(
  "/duos",
  authenticate,
  async (req: Request, res: Response) => {
    // Always scoped to the caller's group (query groupId is ignored)
    const { groupId } = req.auth!;

    const matches = await Match.find({
      group: groupId,
      status: "finished",
      type: "doubles",
    })
      .populate("teamA.players", "name nickname photo")
      .populate("teamB.players", "name nickname photo");

    const duoStats: Record<
      string,
      { wins: number; total: number; players: any[] }
    > = {};

    for (const match of matches) {
      const processTeam = (team: typeof match.teamA, isWinner: boolean) => {
        if (team.players.length !== 2) return;
        const [p1, p2] = team.players.sort((a, b) =>
          String(a._id).localeCompare(String(b._id)),
        );
        const key = `${p1._id}-${p2._id}`;
        if (!duoStats[key])
          duoStats[key] = { wins: 0, total: 0, players: [p1, p2] };
        duoStats[key].total++;
        if (isWinner) duoStats[key].wins++;
      };

      if (match.winner === "A") {
        processTeam(match.teamA, true);
        processTeam(match.teamB, false);
      } else if (match.winner === "B") {
        processTeam(match.teamA, false);
        processTeam(match.teamB, true);
      }
    }

    const sorted = Object.values(duoStats)
      .map((d) => ({ ...d, winRate: Math.round((d.wins / d.total) * 100) }))
      .filter((d) => d.total >= 2)
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

    res.json(sorted.slice(0, 20));
  },
);

// GET /api/rankings/top-winners
rankingsRouter.get(
  "/top-winners",
  authenticate,
  async (req: Request, res: Response) => {
    // Always scoped to the caller's group (query groupId is ignored)
    const { groupId } = req.auth!;

    const players = await Player.find({ groups: groupId, wins: { $gt: 0 } })
      .sort({ wins: -1 })
      .limit(10)
      .select("name nickname photo wins losses matchesPlayed overall");

    res.json(players);
  },
);
