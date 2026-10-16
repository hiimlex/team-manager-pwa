import { Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { Player } from "../models/Player.js";
import { uploadPhoto } from "../services/cloudinary.js";

export const playersRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const statsSchema = z.object({
  setting: z.number().min(1).max(10).optional(),
  passing: z.number().min(1).max(10).optional(),
  attack: z.number().min(1).max(10).optional(),
  blocking: z.number().min(1).max(10).optional(),
  physical: z.number().min(1).max(10).optional(),
  technique: z.number().min(1).max(10).optional(),
  gameVision: z.number().min(1).max(10).optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  nickname: z.string().min(2).max(20).optional(),
  age: z.number().min(10).max(80).optional(),
  height: z.number().min(100).max(250).optional(),
  gender: z.enum(["M", "F"]).optional(),
  position: z
    .enum(["setter", "outside", "middle", "opposite", "libero", "universal"])
    .optional(),
  stats: statsSchema.optional(),
});

// Only players of the caller's group are visible/editable
const inGroup = (req: Request, id: string | string[]) => ({
  _id: String(id),
  groups: req.auth!.groupId,
});

// GET /api/players/:id
playersRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
  const player = await Player.findOne(inGroup(req, req.params.id)).populate(
    "groups",
    "name type",
  );
  if (!player) {
    res.status(404).json({ error: "Jogador não encontrado" });
    return;
  }
  res.json(player);
});

// PATCH /api/players/:id — update player info/stats
playersRouter.patch(
  "/:id",
  authenticate,
  async (req: Request, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const isOwnProfile = req.auth!.playerId === req.params.id;
    const isAdmin =
      req.auth!.role === "admin" || req.auth!.role === "moderator";

    if (!isOwnProfile && !isAdmin) {
      res
        .status(403)
        .json({ error: "Apenas admin ou o próprio jogador pode editar" });
      return;
    }

    // Stats feed the team draw and rankings: only staff may change them
    if (parsed.data.stats && !isAdmin) {
      res
        .status(403)
        .json({ error: "Apenas admin ou moderador pode alterar stats" });
      return;
    }

    const player = await Player.findOne(inGroup(req, req.params.id));
    if (!player) {
      res.status(404).json({ error: "Jogador não encontrado" });
      return;
    }

    const { stats, ...rest } = parsed.data;
    Object.assign(player, rest);
    if (stats) Object.assign(player.stats, stats);

    await player.save();
    res.json(player);
  },
);

// POST /api/players/:id/photo — upload player photo
playersRouter.post(
  "/:id/photo",
  authenticate,
  upload.single("photo"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Nenhuma imagem enviada" });
      return;
    }

    const isOwnProfile = req.auth!.playerId === req.params.id;
    const isAdmin = req.auth!.role === "admin";
    if (!isOwnProfile && !isAdmin) {
      res.status(403).json({ error: "Permissão negada" });
      return;
    }

    const player = await Player.findOne(inGroup(req, req.params.id));
    if (!player) {
      res.status(404).json({ error: "Jogador não encontrado" });
      return;
    }

    const url = await uploadPhoto(req.file.buffer, `player-${req.params.id}`);
    player.photo = url;
    await player.save();

    res.json({ photo: url });
  },
);

// GET /api/players — list players in a group
playersRouter.get("/", authenticate, async (req: Request, res: Response) => {
  const { groupId } = req.auth!;
  const players = await Player.find({ groups: groupId }).sort({ overall: -1 });
  res.json(players);
});

// POST /api/players/:id/affinity/:targetId — add or update affinity
playersRouter.post(
  "/:id/affinity/:targetId",
  authenticate,
  async (req: Request, res: Response) => {
    const { id, targetId } = req.params;
    if (id === targetId) {
      res
        .status(400)
        .json({ error: "Não é possível adicionar afinidade consigo mesmo" });
      return;
    }
    const isOwnProfile = req.auth!.playerId === id;
    const isAdmin =
      req.auth!.role === "admin" || req.auth!.role === "moderator";
    if (!isOwnProfile && !isAdmin) {
      res.status(403).json({ error: "Permissão negada" });
      return;
    }
    const player = await Player.findOne(inGroup(req, id));
    const target = await Player.findOne(inGroup(req, targetId));
    if (!player || !target) {
      res.status(404).json({ error: "Jogador não encontrado" });
      return;
    }
    const existing = player.affinities.find(
      (a) => a.player.toString() === targetId,
    );
    if (!existing) {
      player.affinities.push({ player: target._id, wins: 0, total: 0 });
      await player.save();
    }
    res.json(player.affinities);
  },
);

// DELETE /api/players/:id/affinity/:targetId — remove affinity
playersRouter.delete(
  "/:id/affinity/:targetId",
  authenticate,
  async (req: Request, res: Response) => {
    const { id, targetId } = req.params;
    const isOwnProfile = req.auth!.playerId === id;
    const isAdmin =
      req.auth!.role === "admin" || req.auth!.role === "moderator";
    if (!isOwnProfile && !isAdmin) {
      res.status(403).json({ error: "Permissão negada" });
      return;
    }
    const player = await Player.findOne(inGroup(req, id));
    if (!player) {
      res.status(404).json({ error: "Jogador não encontrado" });
      return;
    }
    player.affinities = player.affinities.filter(
      (a) => a.player.toString() !== targetId,
    ) as any;
    await player.save();
    res.json({ ok: true });
  },
);

// GET /api/players/:id/affinities — list player affinities with win stats
playersRouter.get(
  "/:id/affinities",
  authenticate,
  async (req: Request, res: Response) => {
    const player = await Player.findOne(inGroup(req, req.params.id)).populate(
      "affinities.player",
      "name nickname photo overall position",
    );
    if (!player) {
      res.status(404).json({ error: "Jogador não encontrado" });
      return;
    }
    const enriched = player.affinities.map((a) => ({
      player: a.player,
      wins: a.wins,
      total: a.total,
      winRate: a.total > 0 ? Math.round((a.wins / a.total) * 100) : 0,
    }));
    res.json(enriched);
  },
);
