import { Router } from "express";
import { authRouter } from "./auth.js";
import { duosRouter } from "./duos.js";
import { groupsRouter } from "./groups.js";
import { matchesRouter } from "./matches.js";
import { playersRouter } from "./players.js";
import { rachasRouter } from "./rachas.js";
import { rankingsRouter } from "./rankings.js";
import { scriptsRouter } from "./scripts.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/players", playersRouter);
router.use("/groups", groupsRouter);
router.use("/rachas", rachasRouter);
router.use("/matches", matchesRouter);
router.use("/rankings", rankingsRouter);
router.use("/scripts", scriptsRouter);
router.use("/duos", duosRouter);
