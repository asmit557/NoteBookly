"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import FileExplorer, { type CodeFile } from "@/app/components/codelab/FileExplorer";
import Editor, { type SaveStatus } from "@/app/components/codelab/Editor";
import OutputConsole, { type CodeOutputRecord } from "@/app/components/codelab/OutputConsole";
import { BACKEND_URL } from "@/lib/backendClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
}

interface CodeLabClientProps {
  user: UserInfo;
}

// Shapes returned by the backend session endpoints
interface SessionResponse {
  id: string;
  name: string;
  language: string;
  files: CodeFile[];
  outputs?: CodeOutputRecord[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTOSAVE_DELAY_MS = 1_000;

// Fallback used only while the real session is loading
const LOADING_FILE: CodeFile = {
  id: "__loading__",
  name: "main.py",
  content: "# Loading session…\n",
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconPlay = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const IconSpinner = () => (
  <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const IconLab = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function syntheticError(message: string): CodeOutputRecord {
  return {
    id: `local-${Date.now()}`,
    stdout: null,
    stderr: message,
    exitCode: -1,
    createdAt: new Date().toISOString(),
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CodeLabClient({ user }: CodeLabClientProps) {
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [sessionName, setSessionName]     = useState("Loading…");
  const [sessionStatus, setSessionStatus] = useState<"loading" | "ready" | "error">("loading");
  const [files, setFiles]                 = useState<CodeFile[]>([LOADING_FILE]);
  const [activeFileId, setActiveFileId]   = useState<string | null>(LOADING_FILE.id);
  const [outputs, setOutputs]             = useState<CodeOutputRecord[]>([]);
  const [isRunning, setIsRunning]         = useState(false);
  const [saveStatus, setSaveStatus]       = useState<SaveStatus>("idle");

  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId) ?? null;

  // ── Session initialisation ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const headers = { "x-user-id": user.id };

        // 1. Try to load the most recent existing session
        const listRes = await fetch(`${BACKEND_URL}/api/codelab/session`, { headers });
        if (listRes.ok) {
          const sessions = (await listRes.json()) as SessionResponse[];
          if (sessions.length > 0) {
            const latest = sessions[0];
            const detailRes = await fetch(
              `${BACKEND_URL}/api/codelab/session/${latest.id}`,
              { headers }
            );
            if (detailRes.ok) {
              const s = (await detailRes.json()) as SessionResponse;
              if (!cancelled) {
                applySession(s);
                return;
              }
            }
          }
        }

        // 2. No sessions yet — create one
        const createRes = await fetch(`${BACKEND_URL}/api/codelab/session/create`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Session" }),
        });
        if (createRes.ok && !cancelled) {
          applySession((await createRes.json()) as SessionResponse);
        } else if (!cancelled) {
          setSessionStatus("error");
          setSessionName("Offline");
          // Keep the editor usable — user can type but save/run will no-op
          setFiles([{ id: "offline-1", name: "main.py", content: "# Start coding here\nprint('Hello!')\n" }]);
          setActiveFileId("offline-1");
        }
      } catch {
        if (!cancelled) {
          setSessionStatus("error");
          setSessionName("Offline");
          setFiles([{ id: "offline-1", name: "main.py", content: "# Start coding here\nprint('Hello!')\n" }]);
          setActiveFileId("offline-1");
        }
      }
    }

    function applySession(s: SessionResponse) {
      setSessionId(s.id);
      setSessionName(s.name);
      const sessionFiles = s.files.length > 0
        ? s.files
        : [{ id: "fallback-1", name: "main.py", content: "# Start coding here\n" }];
      setFiles(sessionFiles);
      setActiveFileId(sessionFiles[0].id);
      if (s.outputs && s.outputs.length > 0) {
        // Show up to 50 most recent past outputs, oldest first
        setOutputs(
          [...s.outputs]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(-50)
        );
      }
      setSessionStatus("ready");
    }

    init();
    return () => { cancelled = true; };
  }, [user.id]);

  // ── Auto-save ─────────────────────────────────────────────────────────────

  const persistFile = useCallback(
    async (fileId: string, content: string) => {
      if (!sessionId) return;
      setSaveStatus("saving");
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/codelab/session/${sessionId}/save`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": user.id },
            body: JSON.stringify({ fileId, content }),
          }
        );
        if (!res.ok) throw new Error();
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2_000);
      } catch {
        setSaveStatus("error");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3_000);
      }
    },
    [sessionId, user.id]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, content } : f))
      );
      setSaveStatus("idle");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (activeFileId) persistFile(activeFileId, content);
      }, AUTOSAVE_DELAY_MS);
    },
    [activeFileId, persistFile]
  );

  // ── File switching ────────────────────────────────────────────────────────

  const handleSelectFile = useCallback((id: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setActiveFileId(id);
    setSaveStatus("idle");
  }, []);

  // ── Run ───────────────────────────────────────────────────────────────────

  const handleRun = useCallback(async () => {
    if (!sessionId || !activeFile || isRunning) return;

    // Flush pending auto-save so the backend always has the latest code
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setIsRunning(true);

    try {
      // 1. Ensure latest content is persisted before executing
      await fetch(`${BACKEND_URL}/api/codelab/session/${sessionId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ fileId: activeFile.id, content: activeFile.content }),
      });

      // 2. Execute
      const res = await fetch(
        `${BACKEND_URL}/api/codelab/session/${sessionId}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({ fileId: activeFile.id }),
        }
      );

      if (res.status === 503) {
        throw new Error("Execution service unavailable. Check backend logs.");
      }

      // 408 = timed out, but body still contains the CodeOutput record
      const output = (await res.json()) as CodeOutputRecord;
      setOutputs((prev) => [...prev, output]);
    } catch (err) {
      setOutputs((prev) => [
        ...prev,
        syntheticError(err instanceof Error ? err.message : "Execution failed"),
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [sessionId, activeFile, isRunning, user.id]);

  // ── New file ──────────────────────────────────────────────────────────────
  // (full API wiring deferred — add file to local state for now)

  const handleNewFile = useCallback(async () => {
    if (!sessionId) return;
    const name = `script_${files.length + 1}.py`;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/codelab/session/${sessionId}/files`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({ name, content: `# ${name}\n` }),
        }
      );
      if (res.ok) {
        const newFile = (await res.json()) as CodeFile;
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
      }
    } catch {
      // Optimistic local fallback when backend is offline
      const newFile: CodeFile = { id: `local-${Date.now()}`, name, content: `# ${name}\n` };
      setFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
    }
  }, [sessionId, files.length, user.id]);

  // ── Misc ──────────────────────────────────────────────────────────────────

  const handleClearOutput = useCallback(() => setOutputs([]), []);
  const firstName = user.name?.split(" ")[0] ?? "there";

  // ── Footer indicators ─────────────────────────────────────────────────────

  const footerDot =
    sessionStatus === "ready"  ? "bg-emerald-400" :
    sessionStatus === "error"  ? "bg-red-400"     : "bg-yellow-400 animate-pulse";

  const footerLabel =
    sessionStatus === "ready"  ? "Backend connected" :
    sessionStatus === "error"  ? "Backend offline" : "Connecting…";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface]/60 backdrop-blur-sm shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[--accent-muted] text-[--accent]">
            <IconLab />
          </div>
          <div>
            <p className="text-sm font-semibold text-[--foreground] leading-tight">
              Code Lab
            </p>
            <p className="text-[11px] text-[--muted]">
              {sessionName} · Python 3.10
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning || !activeFile || sessionStatus !== "ready"}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[--accent] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
        >
          {isRunning ? <IconSpinner /> : <IconPlay />}
          {isRunning ? "Running…" : "Run"}
        </button>
      </motion.div>

      {/* ── IDE body ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-1 overflow-hidden"
      >
        <div className="w-48 shrink-0">
          <FileExplorer
            files={files.filter((f) => f.id !== LOADING_FILE.id)}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onNewFile={handleNewFile}
          />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              file={sessionStatus === "loading" ? LOADING_FILE : activeFile}
              saveStatus={saveStatus}
              onChange={handleContentChange}
            />
          </div>

          <div className="h-52 shrink-0">
            <OutputConsole
              outputs={outputs}
              isRunning={isRunning}
              sessionStatus={sessionStatus}
              onClear={handleClearOutput}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Footer status bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[--border] bg-[--background]/80 text-[10px] text-[--muted] shrink-0">
        <span>{firstName}&apos;s session</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${footerDot}`} />
            {footerLabel}
          </span>
          {sessionId && (
            <span className="font-mono opacity-50">{sessionId.slice(0, 8)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
