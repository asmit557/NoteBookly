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
  renameFile,
  deleteFileById,
  duplicateFile,
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

// ── File management (file-centric, no sessionId in URL) ───────────────────────
// PATCH  /api/codelab/file/:fileId/rename
router.patch("/file/:fileId/rename", renameFile);

// DELETE /api/codelab/file/:fileId
router.delete("/file/:fileId", deleteFileById);

// POST   /api/codelab/file/:fileId/duplicate
router.post("/file/:fileId/duplicate", duplicateFile);

// ── Execution ─────────────────────────────────────────────────────────────────
// POST /api/codelab/session/:id/run
router.post("/session/:id/run", runCode);

// GET  /api/codelab/session/:id/outputs
router.get("/session/:id/outputs", getOutputs);

export default router;
