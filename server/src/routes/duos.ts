import { Request, Response, Router } from "express";
import { z } from "zod";
import {
  authenticate,
  requireOwnGroup,
  requireRole,
} from "../middleware/auth.js";
import { Duo } from "../models/Duo.js";
import { Player } from "../models/Player.js";

export const duosRouter = Router();

const createSchema = z.object({
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  name: z.string().max(40).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  active: z.boolean().optional(),
});

// POST /api/duos — register a duo in the current group
duosRouter.post(
  "/",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { player1Id, player2Id, name } = parsed.data;
    const { groupId } = req.auth!;

    if (player1Id === player2Id) {
      res
        .status(400)
        .json({ error: "Uma dupla precisa de dois jogadores diferentes" });
      return;
    }

    const [p1, p2] = await Promise.all([
      Player.findOne({ _id: player1Id, groups: groupId }),
      Player.findOne({ _id: player2Id, groups: groupId }),
    ]);
    if (!p1 || !p2) {
      res.status(404).json({ error: "Jogador não encontrado" });
      return;
    }

    // Check for existing duo (both orderings)
    const existing = await Duo.findOne({
      group: groupId,
      $or: [
        { players: [player1Id, player2Id] },
        { players: [player2Id, player1Id] },
      ],
    });
    if (existing) {
      res.status(409).json({ error: "Essa dupla já está cadastrada no grupo" });
      return;
    }

    const duo = await Duo.create({
      group: groupId,
      players: [player1Id, player2Id],
      name: name || `${p1.nickname} & ${p2.nickname}`,
    });

    const populated = await Duo.findById(duo._id).populate(
      "players",
      "name nickname photo overall position",
    );
    res.status(201).json(populated);
  },
);

// GET /api/duos/group/:groupId — list duos for a group
duosRouter.get(
  "/group/:groupId",
  authenticate,
  requireOwnGroup(),
  async (req: Request, res: Response) => {
    const duos = await Duo.find({ group: req.params.groupId, active: true })
      .populate("players", "name nickname photo overall position")
      .sort({ wins: -1, matchesPlayed: -1 });
    res.json(duos);
  },
);

// GET /api/duos/:id
duosRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
  const duo = await Duo.findOne({
    _id: req.params.id,
    group: req.auth!.groupId,
  }).populate("players", "name nickname photo overall position stats");
  if (!duo) {
    res.status(404).json({ error: "Dupla não encontrada" });
    return;
  }
  res.json(duo);
});

// PATCH /api/duos/:id — rename or deactivate
duosRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin", "moderator"),
  async (req: Request, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { name, active } = parsed.data;
    const duo = await Duo.findOneAndUpdate(
      { _id: req.params.id, group: req.auth!.groupId },
      {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
      },
      { new: true },
    ).populate("players", "name nickname photo overall");
    if (!duo) {
      res.status(404).json({ error: "Dupla não encontrada" });
      return;
    }
    res.json(duo);
  },
);

// DELETE /api/duos/:id — hard delete
duosRouter.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    await Duo.findOneAndDelete({
      _id: req.params.id,
      group: req.auth!.groupId,
    });
    res.json({ ok: true });
  },
);

// GET /api/duos/player/:playerId — duos a player belongs to in their group
duosRouter.get(
  "/player/:playerId",
  authenticate,
  async (req: Request, res: Response) => {
    const { groupId } = req.auth!;
    const duos = await Duo.find({
      group: groupId,
      players: req.params.playerId,
      active: true,
    }).populate("players", "name nickname photo overall");
    res.json(duos);
  },
);
