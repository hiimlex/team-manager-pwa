import { Request, Response, Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import { Match } from "../models/Match.js";
import { Player } from "../models/Player.js";
import { RachaSession } from "../models/RachaSession.js";
import { io } from "../server.js";

export const matchesRouter = Router();

const createMatchSchema = z.object({
  rachaId: z.string(),
  teamAPlayers: z.array(z.string()).min(1).max(10),
  teamBPlayers: z.array(z.string()).min(1).max(10),
  type: z.enum(["quartet", "doubles"]),
});

const scoreSchema = z.object({
  team: z.enum(["A", "B"]),
  score: z.number().int().min(0).max(99),
});

// POST /api/matches — create a new match within a racha
matchesRouter.post(
  "/",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { rachaId, teamAPlayers, teamBPlayers, type } = parsed.data;
    const racha = await RachaSession.findOne({
      _id: rachaId,
      group: req.auth!.groupId,
    });
    if (!racha) {
      res.status(404).json({ error: "Racha não encontrado" });
      return;
    }

    // Teams must be drawn from the racha's players
    const rachaPlayers = new Set(racha.players.map(String));
    if (
      ![...teamAPlayers, ...teamBPlayers].every((id) => rachaPlayers.has(id))
    ) {
      res.status(400).json({ error: "Jogador não pertence a este racha" });
      return;
    }

    const match = await Match.create({
      rachaSession: rachaId,
      group: racha.group,
      type,
      teamA: { players: teamAPlayers, score: 0 },
      teamB: { players: teamBPlayers, score: 0 },
      status: "ongoing",
    });

    racha.matches.push(match._id);
    await racha.save();

    io.to(String(racha.group)).emit("match:created", { match });

    res.status(201).json(match);
  },
);

// PATCH /api/matches/:id/score — update score (real-time)
matchesRouter.patch(
  "/:id/score",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const parsed = scoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const match = await Match.findOne({
      _id: req.params.id,
      group: req.auth!.groupId,
    });
    if (!match) {
      res.status(404).json({ error: "Partida não encontrada" });
      return;
    }
    if (match.status === "finished") {
      res.status(400).json({ error: "Partida já finalizada" });
      return;
    }

    const { team, score } = parsed.data;
    if (team === "A") match.teamA.score = score;
    else match.teamB.score = score;

    // Check win condition
    const a = match.teamA.score;
    const b = match.teamB.score;
    const maxScore = 12;
    const isDeuce = a >= maxScore - 1 && b >= maxScore - 1;
    const hasWinner = !isDeuce
      ? a >= maxScore || b >= maxScore
      : Math.abs(a - b) >= 2;

    if (hasWinner) {
      match.winner = a > b ? "A" : "B";
      match.status = "finished";

      const winnerPlayers =
        match.winner === "A" ? match.teamA.players : match.teamB.players;
      const loserPlayers =
        match.winner === "A" ? match.teamB.players : match.teamA.players;

      await Player.updateMany(
        { _id: { $in: winnerPlayers } },
        { $inc: { wins: 1, matchesPlayed: 1 } },
      );
      await Player.updateMany(
        { _id: { $in: loserPlayers } },
        { $inc: { losses: 1, matchesPlayed: 1 } },
      );

      // Update affinity stats for all pairs in the winning team
      const winnerIds = winnerPlayers.map(String);
      const allIds = [...winnerIds, ...loserPlayers.map(String)];
      for (const pid of winnerIds) {
        const teammates = winnerIds.filter((id) => id !== pid);
        for (const tid of teammates) {
          // Increment total and wins for pid→tid affinity pair
          await Player.updateOne(
            { _id: pid, "affinities.player": tid },
            { $inc: { "affinities.$.wins": 1, "affinities.$.total": 1 } },
          );
          await Player.updateOne(
            { _id: tid, "affinities.player": pid },
            { $inc: { "affinities.$.wins": 1, "affinities.$.total": 1 } },
          );
        }
        // Also track total matches for all cross-pairs (winner vs loser)
        for (const lid of loserPlayers.map(String)) {
          await Player.updateOne(
            { _id: pid, "affinities.player": lid },
            { $inc: { "affinities.$.total": 1 } },
          );
        }
      }
    }

    await match.save();

    io.to(String(match.group)).emit("match:score", {
      matchId: match._id,
      scoreA: match.teamA.score,
      scoreB: match.teamB.score,
      winner: match.winner,
      status: match.status,
    });

    res.json(match);
  },
);

// GET /api/matches/:id
matchesRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
  const match = await Match.findOne({
    _id: req.params.id,
    group: req.auth!.groupId,
  })
    .populate("teamA.players", "name nickname photo")
    .populate("teamB.players", "name nickname photo");

  if (!match) {
    res.status(404).json({ error: "Partida não encontrada" });
    return;
  }
  res.json(match);
});
