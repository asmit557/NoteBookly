"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FileExplorer, { type CodeFile } from "@/app/components/codelab/FileExplorer";
import Editor from "@/app/components/codelab/Editor";
import OutputConsole, { type CodeOutputRecord } from "@/app/components/codelab/OutputConsole";

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
}

interface CodeLabClientProps {
  user: UserInfo;
}

// ── Placeholder data (replaced by real API calls in the next task) ────────────

const PLACEHOLDER_FILES: CodeFile[] = [
  {
    id: "file-1",
    name: "main.py",
    content: "# Start coding here\nprint('Hello, NoteBookly!')\n",
  },
];

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

// ── Main component ────────────────────────────────────────────────────────────

export default function CodeLabClient({ user }: CodeLabClientProps) {
  const [files, setFiles] = useState<CodeFile[]>(PLACEHOLDER_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>(
    PLACEHOLDER_FILES[0]?.id ?? null
  );
  const [outputs, setOutputs] = useState<CodeOutputRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId) ?? null;

  function handleContentChange(content: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content } : f))
    );
  }

  function handleNewFile() {
    // Logic wired up in next task
  }

  function handleRun() {
    // Logic wired up in next task
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500); // placeholder pulse
  }

  function handleClearOutput() {
    setOutputs([]);
  }

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface]/60 backdrop-blur-sm shrink-0"
      >
        {/* Left: title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[--accent-muted] text-[--accent]">
            <IconLab />
          </div>
          <div>
            <p className="text-sm font-semibold text-[--foreground] leading-tight">
              Code Lab
            </p>
            <p className="text-[11px] text-[--muted]">
              Untitled Session · Python 3.10
            </p>
          </div>
        </div>

        {/* Right: run button */}
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning || !activeFile}
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
        {/* File explorer sidebar */}
        <div className="w-48 shrink-0">
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onNewFile={handleNewFile}
          />
        </div>

        {/* Editor + console column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Editor — takes up remaining space above console */}
          <div className="flex-1 overflow-hidden bg-[--background]/60">
            <Editor file={activeFile} onChange={handleContentChange} />
          </div>

          {/* Output console — fixed height */}
          <div className="h-52 shrink-0">
            <OutputConsole
              outputs={outputs}
              isRunning={isRunning}
              onClear={handleClearOutput}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Footer status bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[--border] bg-[--background]/80 text-[10px] text-[--muted] shrink-0">
        <span>
          {firstName}&apos;s session
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Backend connected
          </span>
          <span>Docker ready</span>
        </div>
      </div>
    </div>
  );
}
