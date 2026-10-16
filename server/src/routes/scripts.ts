import { Request, Response, Router } from "express";
import { z } from "zod";
import {
  authenticate,
  requireOwnGroup,
  requireRole,
} from "../middleware/auth.js";
import { DrawScript } from "../models/DrawScript.js";
import { Player } from "../models/Player.js";
import { runPythonScript } from "../services/pythonRunner.js";

export const scriptsRouter = Router();

const scriptSchema = z.object({
  name: z.string().min(1).max(60),
  code: z.string().min(1).max(10000),
  isDefault: z.boolean().optional(),
});

const testSchema = z.object({
  code: z.string().min(1).max(10000),
  playerIds: z.array(z.string()).max(100).optional(),
  type: z.enum(["quartet", "doubles"]).default("quartet"),
});

// GET /api/scripts/group/:groupId — list scripts for group
scriptsRouter.get(
  "/group/:groupId",
  authenticate,
  requireOwnGroup(),
  async (req: Request, res: Response) => {
    const scripts = await DrawScript.find({ group: req.params.groupId })
      .populate("createdBy", "name nickname")
      .sort({ createdAt: -1 });
    res.json(scripts);
  },
);

// POST /api/scripts — create new script
scriptsRouter.post(
  "/",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const parsed = scriptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { groupId, playerId } = req.auth!;
    const script = await DrawScript.create({
      ...parsed.data,
      group: groupId,
      createdBy: playerId,
    });
    res.status(201).json(script);
  },
);

// PATCH /api/scripts/:id — update script
scriptsRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const parsed = scriptSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const script = await DrawScript.findOneAndUpdate(
      { _id: req.params.id, group: req.auth!.groupId },
      parsed.data,
      { new: true },
    );
    if (!script) {
      res.status(404).json({ error: "Script não encontrado" });
      return;
    }
    res.json(script);
  },
);

// DELETE /api/scripts/:id
scriptsRouter.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    await DrawScript.findOneAndDelete({
      _id: req.params.id,
      group: req.auth!.groupId,
    });
    res.json({ ok: true });
  },
);

// POST /api/scripts/test — test a script with mock data
scriptsRouter.post(
  "/test",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const parsed = testSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { code, playerIds, type } = parsed.data;

    const { groupId } = req.auth!;
    let players;

    if (playerIds?.length) {
      players = await Player.find({ _id: { $in: playerIds }, groups: groupId });
    } else {
      // Use up to 8 players from the group for testing
      players = await Player.find({ groups: groupId }).limit(8);
    }

    if (players.length < 4) {
      res
        .status(400)
        .json({ error: "São necessários pelo menos 4 jogadores para testar" });
      return;
    }

    try {
      const teams = await runPythonScript(code, players, type);
      res.json({ teams, playerCount: players.length });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// GET /api/scripts/templates — built-in script templates
scriptsRouter.get("/templates", (_req, res) => {
  res.json([
    {
      name: "Serpentina (padrão)",
      description: "Ordena por overall e distribui em serpentina",
      code: `# Serpentina: ordena por overall e distribui alternadamente
players_sorted = sorted(players, key=lambda p: p['overall'], reverse=True)
teams = [[], []]
for i, player in enumerate(players_sorted):
    teams[i % 2].append(player['_id'])
`,
    },
    {
      name: "Balanceado por Posição",
      description: "Garante levantadores em times diferentes",
      code: `# Separa levantadores e distribui para times opostos
setters = [p for p in players if p['position'] == 'setter']
others  = sorted([p for p in players if p['position'] != 'setter'],
                 key=lambda p: p['overall'], reverse=True)

teams = [[], []]
for i, s in enumerate(setters):
    teams[i % 2].append(s['_id'])
for i, p in enumerate(others):
    teams[i % 2].append(p['_id'])
`,
    },
    {
      name: "Aleatório",
      description: "Sorteio completamente aleatório",
      code: `import random
shuffled = players[:]
random.shuffle(shuffled)
mid = len(shuffled) // 2
teams = [
    [p['_id'] for p in shuffled[:mid]],
    [p['_id'] for p in shuffled[mid:]],
]
`,
    },
  ]);
});
