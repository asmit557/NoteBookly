import { prisma } from "../../lib/prisma";
import { runPython } from "../execution/docker.runner";

// ── Helpers ───────────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
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

  await prisma.$transaction(async (tx) => {
    const file = await tx.codeFile.findFirst({
      where: { id: fileId, sessionId },
      select: { id: true },
    });
    if (!file) throw new NotFoundError("File not found");

    const count = await tx.codeFile.count({ where: { sessionId } });
    if (count <= 1) throw new ConflictError("Cannot delete the last file in a session");

    await tx.codeFile.delete({ where: { id: fileId } });
  });
}

// ── File-centric services (ownership via session) ─────────────────────────────

/**
 * Verify the file exists AND its session belongs to the user.
 * Returns only the fields needed for ownership/routing — does NOT fetch content,
 * so callers that need content must query it separately.
 */
async function assertFileOwnership(fileId: string, userId: string) {
  const file = await prisma.codeFile.findFirst({
    where: { id: fileId, session: { userId } },
    select: { id: true, name: true, sessionId: true },
  });
  if (!file) throw new NotFoundError("File not found");
  return file;
}

function buildCopyName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return `${name}_copy`;
  return `${name.slice(0, dot)}_copy${name.slice(dot)}`;
}

export async function renameFile(fileId: string, userId: string, name: string) {
  await assertFileOwnership(fileId, userId);
  return prisma.codeFile.update({
    where: { id: fileId },
    data: { name },
  });
}

export async function deleteFileById(fileId: string, userId: string) {
  const { sessionId } = await assertFileOwnership(fileId, userId);

  await prisma.$transaction(async (tx) => {
    const count = await tx.codeFile.count({ where: { sessionId } });
    if (count <= 1) throw new ConflictError("Cannot delete the last file in a session");
    await tx.codeFile.delete({ where: { id: fileId } });
  });
}

export async function duplicateFile(fileId: string, userId: string) {
  // Fetch content alongside the ownership check — content is needed for the copy.
  const file = await prisma.codeFile.findFirst({
    where: { id: fileId, session: { userId } },
    select: { id: true, name: true, content: true, sessionId: true },
  });
  if (!file) throw new NotFoundError("File not found");

  return prisma.codeFile.create({
    data: {
      sessionId: file.sessionId,
      name: buildCopyName(file.name),
      content: file.content,
    },
  });
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

// ── Execution service ─────────────────────────────────────────────────────────

/**
 * Run the target file through the Docker sandbox and persist the result.
 *
 * Resolution order for the file to execute:
 *   1. fileId explicitly passed in the request body
 *   2. The file named "main.py" in the session
 *   3. The first file in the session (fallback)
 *
 * The CodeOutput row is always appended — never overwritten — so the full
 * execution history is preserved.
 */
export async function executeCode(
  sessionId: string,
  userId: string,
  fileId?: string
) {
  // 1. Fetch session + files (ownership check included)
  const session = await prisma.codeSession.findFirst({
    where: { id: sessionId, userId },
    include: { files: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new NotFoundError("Session not found");

  // 2. Resolve which file to run
  let target = fileId
    ? session.files.find((f) => f.id === fileId)
    : session.files.find((f) => f.name === "main.py") ?? session.files[0];

  if (!target) {
    throw new NotFoundError(
      fileId ? "File not found" : "No files in session"
    );
  }

  // 3. Execute in Docker sandbox
  const result = await runPython(target.content);

  // Docker itself failed to start (image missing, daemon down, etc.)
  // This is a server-side problem — do not persist and surface as 503.
  if (result.exitCode === -1 && result.stderr.startsWith("Failed to start Python runner:")) {
    throw new ExecutionError("Execution service unavailable: " + result.stderr);
  }

  // 4. Normalise timeout: use exit code 124 (POSIX convention) and prefix stderr
  const exitCode = result.timedOut ? 124 : result.exitCode;
  const stderr = result.timedOut
    ? `[timeout] execution exceeded 5 seconds\n${result.stderr}`.trimEnd()
    : result.stderr || null;

  // 5. Append output record — never update existing rows (history is immutable)
  const output = await prisma.codeOutput.create({
    data: {
      sessionId,
      stdout: result.stdout || null,
      stderr: stderr || null,
      exitCode,
    },
  });

  return { output, timedOut: result.timedOut };
}
