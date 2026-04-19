"use client";

import { useEffect, useRef } from "react";

export interface CodeOutputRecord {
  id: string;
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  createdAt: string;
}

interface OutputConsoleProps {
  outputs: CodeOutputRecord[];
  isRunning: boolean;
  sessionStatus: "loading" | "ready" | "error";
  onClear: () => void;
}

const IconTerminal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);

const IconTrash = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);

function Spinner() {
  return (
    <span className="block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
  );
}

function ExitBadge({ code }: { code: number | null }) {
  if (code === null) return null;
  const ok = code === 0;
  const timeout = code === 124;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${
        timeout
          ? "bg-yellow-500/10 text-yellow-400"
          : ok
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {timeout ? "TIMEOUT" : ok ? "OK" : `EXIT ${code}`}
    </span>
  );
}

function OutputBlock({ output }: { output: CodeOutputRecord }) {
  const hasContent = output.stdout || output.stderr;
  return (
    <div className="mb-3 last:mb-0">
      {/* Run header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-[--muted] tabular-nums">
          {new Date(output.createdAt).toLocaleTimeString()}
        </span>
        <ExitBadge code={output.exitCode} />
      </div>

      {!hasContent && (
        <p className="text-[--muted] text-xs italic">No output</p>
      )}

      {output.stdout && (
        <pre className="text-emerald-400 text-[12px] leading-relaxed whitespace-pre-wrap break-words">
          {output.stdout}
        </pre>
      )}
      {output.stderr && (
        <pre className="text-red-400 text-[12px] leading-relaxed whitespace-pre-wrap break-words mt-1">
          {output.stderr}
        </pre>
      )}
    </div>
  );
}

export default function OutputConsole({
  outputs,
  isRunning,
  sessionStatus,
  onClear,
}: OutputConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [outputs, isRunning]);

  const emptyMessage =
    sessionStatus === "loading" ? "Connecting to session…" :
    isRunning                   ? "Waiting for output…"   :
                                  "Run your code to see output here";

  return (
    <div className="flex flex-col h-full border-t border-[--border]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[--surface]/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[--muted-light]"><IconTerminal /></span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[--muted]">
            Output
          </span>
          {isRunning && (
            <>
              <Spinner />
              <span className="text-[10px] text-[--accent] animate-pulse">Running…</span>
            </>
          )}
          {!isRunning && outputs.length > 0 && (
            <span className="text-[10px] text-[--muted]">
              {outputs.length} run{outputs.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {outputs.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            title="Clear output"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] text-[--muted] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <IconTrash />
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 font-mono bg-[--background]/60 text-[13px] leading-relaxed">
        {outputs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-[11px] text-[--muted]">{emptyMessage}</p>
          </div>
        ) : (
          [...outputs]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((out) => <OutputBlock key={out.id} output={out} />)
        )}
      </div>
    </div>
  );
}
