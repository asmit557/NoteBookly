import { prisma } from "../../lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Assert the session exists AND belongs to the requesting user. */
async function assertOwnership(sessionId: string, userId: string) {
  const session = await prisma.codeSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) throw new NotFoundError("Session not found");
}

// ── Session services ──────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  name?: string,
  language?: string
) {
  return prisma.codeSession.create({
    data: {
      userId,
      name: name ?? "Untitled Session",
      language: language ?? "python",
      files: {
        create: {
          name: "main.py",
          content: "# Start coding here\n",
        },
      },
    },
    include: {
      files: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getSession(sessionId: string, userId: string) {
  const session = await prisma.codeSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      files: { orderBy: { createdAt: "asc" } },
      outputs: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!session) throw new NotFoundError("Session not found");
  return session;
}

export async function listSessions(userId: string) {
  return prisma.codeSession.findMany({
    where: { userId },
    include: {
      files: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function deleteSession(sessionId: string, userId: string) {
  await assertOwnership(sessionId, userId);
  await prisma.codeSession.delete({ where: { id: sessionId } });
}

// ── File services ─────────────────────────────────────────────────────────────

export async function saveFile(
  sessionId: string,
  userId: string,
  fileId: string,
  content: string
) {
  await assertOwnership(sessionId, userId);

  const file = await prisma.codeFile.findFirst({
    where: { id: fileId, sessionId },
    select: { id: true },
  });
  if (!file) throw new NotFoundError("File not found");

  return prisma.codeFile.update({
    where: { id: fileId },
    data: { content },
  });
}

export async function createFile(
  sessionId: string,
  userId: string,
  name: string,
  content = ""
) {
  await assertOwnership(sessionId, userId);
  return prisma.codeFile.create({
    data: { sessionId, name, content },
  });
}

export async function deleteFile(
  sessionId: string,
  userId: string,
  fileId: string
) {
  await assertOwnership(sessionId, userId);
  const file = await prisma.codeFile.findFirst({
    where: { id: fileId, sessionId },
    select: { id: true },
  });
  if (!file) throw new NotFoundError("File not found");
  await prisma.codeFile.delete({ where: { id: fileId } });
}

// ── Output services ───────────────────────────────────────────────────────────

export async function getOutputs(sessionId: string, userId: string) {
  await assertOwnership(sessionId, userId);
  return prisma.codeOutput.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
