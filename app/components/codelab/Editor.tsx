"use client";

import dynamic from "next/dynamic";
import type { BeforeMount } from "@monaco-editor/react";
import type { CodeFile } from "./FileExplorer";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorProps {
  file: CodeFile | null;
  saveStatus: SaveStatus;
  onChange: (content: string) => void;
}

// ── Monaco — loaded from CDN, client-side only ────────────────────────────────
// Must use dynamic + ssr:false because Monaco reads window/document on import.

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

// ── Custom theme matching NoteBookly's dark palette ───────────────────────────

const NOTEBOOKLY_DARK = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "comment",              foreground: "6b7280", fontStyle: "italic" },
    { token: "keyword",              foreground: "a78bfa" },
    { token: "keyword.control",      foreground: "a78bfa" },
    { token: "string",               foreground: "86efac" },
    { token: "string.escape",        foreground: "6ee7b7" },
    { token: "number",               foreground: "fb923c" },
    { token: "type",                 foreground: "60a5fa" },
    { token: "type.identifier",      foreground: "60a5fa" },
    { token: "identifier",           foreground: "f0f0f5" },
    { token: "delimiter",            foreground: "94a3b8" },
    { token: "operator",             foreground: "e2e8f0" },
    { token: "function",             foreground: "93c5fd" },
    { token: "variable",             foreground: "f0f0f5" },
    { token: "constant",             foreground: "fb923c" },
    { token: "class",                foreground: "f472b6" },
    { token: "decorator",            foreground: "f472b6" },
  ],
  colors: {
    "editor.background":                    "#080810",
    "editor.foreground":                    "#f0f0f5",
    "editor.lineHighlightBackground":       "#0f0f1a",
    "editor.lineHighlightBorder":           "#00000000",
    "editor.selectionBackground":           "#6c63ff33",
    "editor.inactiveSelectionBackground":   "#6c63ff1a",
    "editorCursor.foreground":              "#6c63ff",
    "editorLineNumber.foreground":          "#3d3d5c",
    "editorLineNumber.activeForeground":    "#6b7280",
    "editorIndentGuide.background1":        "#16162a",
    "editorIndentGuide.activeBackground1":  "#2d2d4a",
    "editorWhitespace.foreground":          "#16162a",
    "editorBracketMatch.background":        "#6c63ff22",
    "editorBracketMatch.border":            "#6c63ff66",
    "scrollbarSlider.background":           "#16162a88",
    "scrollbarSlider.hoverBackground":      "#6c63ff33",
    "scrollbarSlider.activeBackground":     "#6c63ff55",
    "editorWidget.background":              "#0f0f1a",
    "editorWidget.border":                  "#ffffff0f",
    "editorSuggestWidget.background":       "#0f0f1a",
    "editorSuggestWidget.border":           "#ffffff0f",
    "editorSuggestWidget.selectedBackground":"#6c63ff22",
    "editorSuggestWidget.foreground":       "#f0f0f5",
    "editorHoverWidget.background":         "#0f0f1a",
    "editorHoverWidget.border":             "#ffffff0f",
    "editorGutter.background":              "#080810",
    "minimap.background":                   "#080810",
  },
} as const;

// ── Editor options ─────────────────────────────────────────────────────────────

const EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  fontLigatures: true,
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  automaticLayout: true,
  padding: { top: 16, bottom: 16 },
  smoothScrolling: true,
  cursorBlinking: "smooth" as const,
  cursorSmoothCaretAnimation: "on" as const,
  renderLineHighlight: "gutter" as const,
  lineNumbers: "on" as const,
  glyphMargin: false,
  folding: true,
  bracketPairColorization: { enabled: true },
  suggest: { showKeywords: true },
  scrollbar: {
    verticalScrollbarSize: 4,
    horizontalScrollbarSize: 4,
    vertical: "auto" as const,
    horizontal: "auto" as const,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  renderWhitespace: "none" as const,
};

// ── Language helpers ──────────────────────────────────────────────────────────

function fileLanguage(name: string): string {
  if (name.endsWith(".py"))                      return "Python";
  if (name.endsWith(".js"))                      return "JavaScript";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "TypeScript";
  if (name.endsWith(".json"))                    return "JSON";
  if (name.endsWith(".md"))                      return "Markdown";
  return "Text";
}

function monacoLanguage(name: string): string {
  if (name.endsWith(".py"))                      return "python";
  if (name.endsWith(".js"))                      return "javascript";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "typescript";
  if (name.endsWith(".json"))                    return "json";
  if (name.endsWith(".md"))                      return "markdown";
  return "plaintext";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#080810]">
      <div className="flex items-center gap-2 text-[--muted] text-xs">
        <span className="block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
        Loading editor…
      </div>
    </div>
  );
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

function LanguageBadge({ name }: { name: string }) {
  const lang = fileLanguage(name);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[--accent-muted] text-[--accent]">
      {lang === "Python" && <IconPy />}
      {lang}
    </span>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const config = {
    saving: { dot: "bg-yellow-400 animate-pulse", label: "Saving…",  color: "text-yellow-400" },
    saved:  { dot: "bg-emerald-400",              label: "Saved",     color: "text-emerald-400" },
    error:  { dot: "bg-red-400",                  label: "Save failed", color: "text-red-400" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${config.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Editor({ file, saveStatus, onChange }: EditorProps) {
  // Define the custom theme before the editor mounts (runs once per page load)
  const handleBeforeMount: BeforeMount = (monaco) => {
    if (!monaco.editor.getEditorTheme().includes("notebookly")) {
      monaco.editor.defineTheme("notebookly-dark", NOTEBOOKLY_DARK);
    }
  };

  if (!file) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[--border] bg-[--surface]/80 shrink-0 min-h-[40px]">
          <span className="px-2 text-[11px] text-[--muted]">No file open</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-[#080810]">
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
        <div className="flex items-center justify-between px-4 py-1 border-t border-[--border] bg-[--background]/80 text-[10px] text-[--muted] shrink-0">
          <span>—</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab bar ── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[--border] bg-[--surface]/80 backdrop-blur-sm shrink-0 min-h-[40px]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[--surface-hover] border border-[--border] text-[11px] font-medium text-[--foreground]">
          <span className="text-[--accent]"><IconPy /></span>
          {file.name}
          <LanguageBadge name={file.name} />
        </div>
        <div className="pr-2">
          <SaveIndicator status={saveStatus} />
        </div>
      </div>

      {/* ── Monaco editor ── */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          path={file.id}
          value={file.content}
          language={monacoLanguage(file.name)}
          theme="notebookly-dark"
          beforeMount={handleBeforeMount}
          onChange={(val) => { if (val !== undefined) onChange(val); }}
          options={EDITOR_OPTIONS}
          loading={<EditorSkeleton />}
        />
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[--border] bg-[--background]/80 text-[10px] text-[--muted] shrink-0">
        <span>{fileLanguage(file.name)}</span>
        <span className="tabular-nums">
          {file.content.split("\n").length} lines · {file.content.length} chars
        </span>
      </div>
    </div>
  );
}
