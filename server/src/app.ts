import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { router } from "./routes/index.js";

const app = express();

// Render sits behind a proxy; needed for express-rate-limit to see real IPs
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() }),
);

// Stricter limits for password checks (brute force) and Python script runs
const strictLimit = (max: number) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas tentativas, tente novamente mais tarde" },
  });
app.post(["/api/auth/login", "/api/auth/register"], strictLimit(20));
// Admins also use /join to bulk-add players, so allow a bit more
app.post(
  [
    "/api/auth/join",
    "/api/scripts/test",
    "/api/rachas",
    "/api/rachas/:id/redraw",
  ],
  strictLimit(60),
);

app.use("/api", router);

// Express 5 forwards rejected async handlers here
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.name === "CastError" || err?.name === "ValidationError") {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  if (err?.type === "entity.parse.failed" || err?.name === "MulterError") {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
