import { Router } from "express";
import { requireUser } from "../../middleware/auth";
import {
  createSession,
  getSession,
  listSessions,
  deleteSession,
  saveFile,
  createFile,
  deleteFile,
  runCode,
  getOutputs,
} from "../controllers/codelab.controller";

const router = Router();

// All Code Lab routes require an authenticated user
router.use(requireUser);

// ── Sessions ──────────────────────────────────────────────────────────────────
// POST /api/codelab/session/create
router.post("/session/create", createSession);

// GET  /api/codelab/session  (list)
router.get("/session", listSessions);

// GET  /api/codelab/session/:id
router.get("/session/:id", getSession);

// DELETE /api/codelab/session/:id
router.delete("/session/:id", deleteSession);

// ── Files ─────────────────────────────────────────────────────────────────────
// POST /api/codelab/session/:id/save  (auto-save existing file)
router.post("/session/:id/save", saveFile);

// POST /api/codelab/session/:id/files  (create new file)
router.post("/session/:id/files", createFile);

// DELETE /api/codelab/session/:id/files/:fileId
router.delete("/session/:id/files/:fileId", deleteFile);

// ── Execution ─────────────────────────────────────────────────────────────────
// POST /api/codelab/session/:id/run
router.post("/session/:id/run", runCode);

// GET  /api/codelab/session/:id/outputs
router.get("/session/:id/outputs", getOutputs);

export default router;
