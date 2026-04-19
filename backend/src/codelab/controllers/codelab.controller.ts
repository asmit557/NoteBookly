import { Request, Response } from "express";

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

export async function listSessions(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

export async function getSession(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

export async function deleteSession(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

// ── Files ─────────────────────────────────────────────────────────────────────

export async function upsertFile(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

export async function deleteFile(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

// ── Execution ─────────────────────────────────────────────────────────────────

export async function runCode(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}

export async function getOutputs(_req: Request, res: Response) {
  res.status(501).json({ message: "Not implemented" });
}
