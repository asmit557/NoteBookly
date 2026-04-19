import { Request, Response } from "express";
import * as svc from "../services/codelab.service";

// ── Shared error handler ──────────────────────────────────────────────────────

function handleError(res: Response, err: unknown) {
  if (err instanceof svc.NotFoundError) {
    return res.status(404).json({ message: err.message });
  }
  console.error("[codelab]", err);
  return res.status(500).json({ message: "Internal server error" });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { name, language } = req.body as { name?: string; language?: string };
    const session = await svc.createSession(userId, name, language);
    res.status(201).json(session);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { id } = req.params;
    const session = await svc.getSession(id, userId);
    res.json(session);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listSessions(_req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const sessions = await svc.listSessions(userId);
    res.json(sessions);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteSession(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { id } = req.params;
    await svc.deleteSession(id, userId);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
}

// ── Files ─────────────────────────────────────────────────────────────────────

export async function saveFile(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { id } = req.params;
    const { fileId, content } = req.body as { fileId: string; content: string };

    if (!fileId || content === undefined) {
      return res.status(400).json({ message: "fileId and content are required" });
    }

    const file = await svc.saveFile(id, userId, fileId, content);
    res.json(file);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createFile(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { id } = req.params;
    const { name, content } = req.body as { name: string; content?: string };

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const file = await svc.createFile(id, userId, name, content);
    res.status(201).json(file);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteFile(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { id, fileId } = req.params;
    await svc.deleteFile(id, userId, fileId);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

export async function getOutputs(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { id } = req.params;
    const outputs = await svc.getOutputs(id, userId);
    res.json(outputs);
  } catch (err) {
    handleError(res, err);
  }
}

// ── Execution stub ────────────────────────────────────────────────────────────

export async function runCode(_req: Request, res: Response) {
  res.status(501).json({ message: "Docker execution not implemented yet" });
}
