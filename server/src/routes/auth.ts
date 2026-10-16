import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Group } from "../models/Group.js";
import { Player } from "../models/Player.js";
import { getJwtSecret } from "../middleware/auth.js";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  nickname: z.string().min(2).max(20),
  gender: z.enum(["M", "F"]),
  height: z.number().min(100).max(250).optional(),
  groupName: z.string().min(2).max(60),
  groupModes: z
    .array(z.enum(["quartet", "doubles"]))
    .min(1)
    .default(["quartet"]),
  adminPassword: z.string().min(4).max(64),
});

const joinSchema = z.object({
  inviteCode: z.string().min(1).max(32),
  name: z.string().min(2).max(60),
  nickname: z.string().min(2).max(20),
  gender: z.enum(["M", "F"]),
  height: z.number().min(100).max(250).optional(),
  adminPassword: z.string().min(4).max(64).optional(),
});

function signToken(
  playerId: string,
  groupId: string,
  role: "admin" | "moderator" | "player",
) {
  return jwt.sign({ playerId, groupId, role }, getJwtSecret(), {
    expiresIn: "30d",
  });
}

async function isNicknameTaken(
  nickname: string,
  groupId: string,
): Promise<boolean> {
  const group = await Group.findById(groupId).select("players");
  if (!group) return false;
  const found = await Player.findOne({
    _id: { $in: group.players },
    nickname: { $regex: `^${escapeRegex(nickname)}$`, $options: "i" },
  }).select("_id");
  return !!found;
}

// POST /api/auth/register — create player + group (becomes admin)
authRouter.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const {
    name,
    nickname,
    gender,
    height,
    groupName,
    groupModes,
    adminPassword,
  } = parsed.data;
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const player = await Player.create({
    name,
    nickname,
    gender,
    ...(height && { height }),
  });
  const group = await Group.create({
    name: groupName,
    modes: groupModes,
    admin: player._id,
    players: [player._id],
    adminPasswordHash,
  });

  player.groups.push(group._id);
  await player.save();

  const token = signToken(String(player._id), String(group._id), "admin");
  res.status(201).json({ token, player, group });
});

// POST /api/auth/join — join existing group via invite code
authRouter.post("/join", async (req: Request, res: Response) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { inviteCode, name, nickname, gender, height, adminPassword } =
    parsed.data;

  const group = await Group.findOne({ inviteCode }).select(
    "+adminPasswordHash",
  );
  if (!group) {
    res.status(404).json({ error: "Código de convite inválido" });
    return;
  }

  const taken = await isNicknameTaken(nickname, String(group._id));
  if (taken) {
    res
      .status(409)
      .json({ error: `O apelido "${nickname}" já está em uso neste grupo` });
    return;
  }

  let role: "admin" | "player" = "player";
  if (adminPassword) {
    if (!group.adminPasswordHash) {
      res
        .status(400)
        .json({ error: "Este grupo não tem senha de admin configurada" });
      return;
    }
    const valid = await bcrypt.compare(adminPassword, group.adminPasswordHash);
    if (!valid) {
      res.status(403).json({ error: "Senha de admin incorreta" });
      return;
    }
    role = "admin";
  }

  const player = await Player.create({
    name,
    nickname,
    gender,
    ...(height && { height }),
  });

  group.players.push(player._id);
  if (role === "admin") group.admin = player._id;
  await group.save();

  player.groups.push(group._id);
  await player.save();

  const token = signToken(String(player._id), String(group._id), role);
  res.json({ token, player, group });
});

// GET /api/auth/group/:code — public group preview by invite code
authRouter.get("/group/:code", async (req: Request, res: Response) => {
  const group = await Group.findOne({ inviteCode: req.params.code })
    .select("name description emblem modes players admin")
    .populate("admin", "name nickname");
  if (!group) {
    res.status(404).json({ error: "Código inválido" });
    return;
  }
  res.json({
    name: group.name,
    description: group.description,
    emblem: group.emblem,
    modes: group.modes,
    playerCount: group.players.length,
    admin: group.admin,
  });
});

// POST /api/auth/login — admin login with nickname + invite code + password
authRouter.post("/login", async (req: Request, res: Response) => {
  const schema = z.object({
    inviteCode: z.string().min(1).max(32),
    nickname: z.string().min(1).max(20),
    adminPassword: z.string().min(1).max(64),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { inviteCode, nickname, adminPassword } = parsed.data;

  const group = await Group.findOne({ inviteCode }).select(
    "+adminPasswordHash",
  );
  if (!group) {
    res.status(404).json({ error: "Código de convite inválido" });
    return;
  }

  if (!group.adminPasswordHash) {
    res
      .status(400)
      .json({ error: "Este grupo não tem senha de admin configurada" });
    return;
  }

  const valid = await bcrypt.compare(adminPassword, group.adminPasswordHash);
  if (!valid) {
    res.status(403).json({ error: "Senha incorreta" });
    return;
  }

  // Find existing player by nickname in this group
  const player = await Player.findOne({
    _id: { $in: group.players },
    nickname: { $regex: `^${escapeRegex(nickname)}$`, $options: "i" },
  });
  if (!player) {
    res.status(404).json({
      error: `Jogador com apelido "${nickname}" não encontrado neste grupo`,
    });
    return;
  }

  // Promote to admin if not already
  if (group.admin.toString() !== player._id.toString()) {
    group.admin = player._id;
    await group.save();
  }

  const token = signToken(String(player._id), String(group._id), "admin");
  res.json({ token, player, group });
});
