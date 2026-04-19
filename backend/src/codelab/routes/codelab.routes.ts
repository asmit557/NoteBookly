import { Router } from "express";
import {
  createSession,
  getSession,
  listSessions,
  deleteSession,
  upsertFile,
  deleteFile,
  runCode,
  getOutputs,
} from "../controllers/codelab.controller";

const router = Router();

// ── Sessions ──────────────────────────────────────────────────────────────────
router.post("/sessions", createSession);
router.get("/sessions", listSessions);
router.get("/sessions/:sessionId", getSession);
router.delete("/sessions/:sessionId", deleteSession);

// ── Files ─────────────────────────────────────────────────────────────────────
router.put("/sessions/:sessionId/files/:fileId", upsertFile);
router.delete("/sessions/:sessionId/files/:fileId", deleteFile);

// ── Execution ─────────────────────────────────────────────────────────────────
router.post("/sessions/:sessionId/run", runCode);
router.get("/sessions/:sessionId/outputs", getOutputs);

export default router;
