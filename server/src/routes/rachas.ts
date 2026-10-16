import { Request, Response, Router } from "express";
import { z } from "zod";
import {
  authenticate,
  requireOwnGroup,
  requireRole,
} from "../middleware/auth.js";
import { Group } from "../models/Group.js";
import { Player } from "../models/Player.js";
import { RachaSession } from "../models/RachaSession.js";
import { runPythonScript } from "../services/pythonRunner.js";
import { buildTeams } from "../services/teamBuilder.js";

export const rachasRouter = Router();

const createRachaSchema = z.object({
  playerIds: z.array(z.string()).min(4).max(100),
  type: z.enum(["quartet", "doubles"]),
  script: z.string().max(10000).optional(),
});

const redrawSchema = z.object({
  script: z.string().max(10000).optional(),
});

// POST /api/rachas — start a new racha session
rachasRouter.post(
  "/",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const parsed = createRachaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { playerIds, type, script } = parsed.data;
    const { groupId } = req.auth!;

    // Only members of the caller's group can be drafted
    const players = await Player.find({
      _id: { $in: playerIds },
      groups: groupId,
    });
    if (players.length < 4) {
      res
        .status(400)
        .json({ error: "Mínimo de 4 jogadores para iniciar um racha" });
      return;
    }

    let teams: string[][];
    if (script) {
      try {
        teams = await runPythonScript(script, players, type);
      } catch (err) {
        res
          .status(400)
          .json({ error: `Erro no script Python: ${(err as Error).message}` });
        return;
      }
    } else {
      teams = buildTeams(players, type);
    }

    const racha = await RachaSession.create({
      group: groupId,
      type,
      players: players.map((p) => p._id),
      teams,
      drawScript: script,
      status: "active",
    });

    await Group.findByIdAndUpdate(groupId, { $set: { lastRacha: racha._id } });

    // Update rachasPlayed for each player
    await Player.updateMany(
      { _id: { $in: players.map((p) => p._id) } },
      { $inc: { rachasPlayed: 1 } },
    );

    res.status(201).json({ racha, teams });
  },
);

// GET /api/rachas/group/:groupId — list rachas for a group
rachasRouter.get(
  "/group/:groupId",
  authenticate,
  requireOwnGroup(),
  async (req: Request, res: Response) => {
    const rachas = await RachaSession.find({ group: req.params.groupId })
      .sort({ date: -1 })
      .limit(20)
      .populate("players", "name nickname photo");
    res.json(rachas);
  },
);

// GET /api/rachas/:id — get racha details with matches
rachasRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
  const racha = await RachaSession.findOne({
    _id: req.params.id,
    group: req.auth!.groupId,
  })
    .populate("players", "name nickname photo overall position")
    .populate({
      path: "matches",
      populate: {
        path: "teamA.players teamB.players",
        select: "name nickname photo",
      },
    });

  if (!racha) {
    res.status(404).json({ error: "Racha não encontrado" });
    return;
  }
  res.json(racha);
});

// POST /api/rachas/:id/finish — close the racha session
rachasRouter.post(
  "/:id/finish",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const racha = await RachaSession.findOneAndUpdate(
      { _id: req.params.id, group: req.auth!.groupId },
      { status: "finished" },
      { new: true },
    );
    if (!racha) {
      res.status(404).json({ error: "Racha não encontrado" });
      return;
    }
    res.json(racha);
  },
);

// POST /api/rachas/:id/redraw — redraw teams (with optional new script)
rachasRouter.post(
  "/:id/redraw",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const parsed = redrawSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const racha = await RachaSession.findOne({
      _id: req.params.id,
      group: req.auth!.groupId,
    }).populate<{
      players: any[];
    }>("players");
    if (!racha) {
      res.status(404).json({ error: "Racha não encontrado" });
      return;
    }

    const { script } = parsed.data;
    const players = racha.players as any[];

    let teams: string[][];
    if (script) {
      try {
        teams = await runPythonScript(script, players, racha.type);
      } catch (err) {
        res
          .status(400)
          .json({ error: `Erro no script: ${(err as Error).message}` });
        return;
      }
    } else {
      teams = buildTeams(players, racha.type);
    }

    racha.teams = teams as any;
    if (script) racha.drawScript = script;
    await racha.save();

    res.json({ teams });
  },
);
