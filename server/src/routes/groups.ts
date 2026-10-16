import { Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  authenticate,
  requireOwnGroup,
  requireRole,
} from "../middleware/auth.js";
import { Group } from "../models/Group.js";
import { Player } from "../models/Player.js";
import { uploadPhoto } from "../services/cloudinary.js";

export const groupsRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const updateGroupSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional(),
  modes: z
    .array(z.enum(["quartet", "doubles"]))
    .min(1)
    .optional(),
});

// GET /api/groups/:id
groupsRouter.get(
  "/:id",
  authenticate,
  requireOwnGroup("id"),
  async (req: Request, res: Response) => {
    const group = await Group.findById(req.params.id)
      .populate("admin", "name nickname photo")
      .populate("players", "name nickname photo overall position gender");

    if (!group) {
      res.status(404).json({ error: "Grupo não encontrado" });
      return;
    }
    res.json(group);
  },
);

// GET /api/groups/invite/:code — get group info by invite code (public)
groupsRouter.get("/invite/:code", async (req: Request, res: Response) => {
  const group = await Group.findOne({ inviteCode: req.params.code })
    .select("name description modes players admin")
    .populate("admin", "name nickname");

  if (!group) {
    res.status(404).json({ error: "Convite inválido" });
    return;
  }
  res.json({
    name: group.name,
    description: group.description,
    modes: group.modes,
    playerCount: group.players.length,
    admin: group.admin,
  });
});

// PATCH /api/groups/:id — update group settings
groupsRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  requireOwnGroup("id"),
  async (req: Request, res: Response) => {
    const parsed = updateGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const group = await Group.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
    });
    if (!group) {
      res.status(404).json({ error: "Grupo não encontrado" });
      return;
    }
    res.json(group);
  },
);

// DELETE /api/groups/:id/players/:playerId — remove player from group
groupsRouter.delete(
  "/:id/players/:playerId",
  authenticate,
  requireRole("admin"),
  requireOwnGroup("id"),
  async (req: Request, res: Response) => {
    const group = await Group.findById(req.params.id);
    if (!group) {
      res.status(404).json({ error: "Grupo não encontrado" });
      return;
    }

    group.players = group.players.filter(
      (p) => p.toString() !== req.params.playerId,
    );
    await group.save();

    await Player.findByIdAndUpdate(req.params.playerId, {
      $pull: { groups: group._id },
    });

    res.json({ ok: true });
  },
);

// POST /api/groups/:id/moderators/:playerId — promote to moderator
groupsRouter.post(
  "/:id/moderators/:playerId",
  authenticate,
  requireRole("admin"),
  requireOwnGroup("id"),
  async (req: Request, res: Response) => {
    const group = await Group.findById(req.params.id);
    if (!group) {
      res.status(404).json({ error: "Grupo não encontrado" });
      return;
    }

    if (!group.players.some((p) => p.toString() === req.params.playerId)) {
      res.status(404).json({ error: "Jogador não pertence ao grupo" });
      return;
    }
    if (!group.moderators.some((m) => m.toString() === req.params.playerId)) {
      group.moderators.push(req.params.playerId as any);
      await group.save();
    }
    res.json({ ok: true });
  },
);

// POST /api/groups/:id/emblem — upload group emblem
groupsRouter.post(
  "/:id/emblem",
  authenticate,
  requireRole("admin"),
  requireOwnGroup("id"),
  upload.single("emblem"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Nenhuma imagem enviada" });
      return;
    }
    const group = await Group.findById(req.params.id);
    if (!group) {
      res.status(404).json({ error: "Grupo não encontrado" });
      return;
    }
    const url = await uploadPhoto(
      req.file.buffer,
      `group-emblem-${req.params.id}`,
    );
    group.emblem = url;
    await group.save();
    res.json({ emblem: url });
  },
);
