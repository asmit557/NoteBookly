"use client";

import type { CodeFile } from "./FileExplorer";

interface EditorProps {
  file: CodeFile | null;
  onChange: (content: string) => void;
}

const IconPy = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2C8 2 6 4 6 7v2h6v1H5c-2 0-3 1-3 4v4c0 2 2 4 4 4h2v-3c0-2 2-3 4-3s4 1 4 3v3h2c2 0 4-2 4-4v-4c0-3-1-4-3-4h-7V9h6V7c0-3-2-5-6-5z"/>
  </svg>
);

const IconCode = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

function fileLanguage(name: string) {
  if (name.endsWith(".py")) return "Python";
  if (name.endsWith(".js") || name.endsWith(".ts")) return "JavaScript";
  return "Text";
}

function LanguageBadge({ name }: { name: string }) {
  const lang = fileLanguage(name);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[--accent-muted] text-[--accent]">
      {lang === "Python" && <IconPy />}
      {lang}
    </span>
  );
}

export default function Editor({ file, onChange }: EditorProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[--border] bg-[--surface]/80 shrink-0 min-h-[40px]">
        {file ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[--surface-hover] border border-[--border] text-[11px] font-medium text-[--foreground]">
            <span className="text-[--accent]"><IconPy /></span>
            {file.name}
            <LanguageBadge name={file.name} />
          </div>
        ) : (
          <span className="px-2 text-[11px] text-[--muted]">No file open</span>
        )}
      </div>

      {/* Gutter + code area */}
      {file ? (
        <div className="flex flex-1 overflow-hidden font-mono text-sm">
          {/* Line gutter */}
          <div
            aria-hidden
            className="w-12 shrink-0 overflow-hidden pt-4 pb-4 text-right pr-3 text-[11px] leading-[1.65rem] select-none border-r border-[--border] bg-[--background]/60"
            style={{ color: "var(--muted)" }}
          >
            {file.content.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Editable area */}
          <textarea
            className="flex-1 resize-none bg-transparent py-4 px-4 text-[--foreground] outline-none leading-[1.65rem] placeholder:text-[--muted] overflow-y-auto"
            value={file.content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="# Start coding here..."
          />
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--surface-hover] text-[--muted]">
            <IconCode />
          </div>
          <div>
            <p className="text-sm font-semibold text-[--foreground]">No file selected</p>
            <p className="text-xs text-[--muted] mt-1">
              Choose a file from the sidebar or create a new one
            </p>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[--border] bg-[--background]/80 text-[10px] text-[--muted] shrink-0">
        <span>{file ? fileLanguage(file.name) : "—"}</span>
        <span>
          {file
            ? `${file.content.split("\n").length} lines · ${file.content.length} chars`
            : ""}
        </span>
      </div>
    </div>
  );
}
