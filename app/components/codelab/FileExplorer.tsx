"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface CodeFile {
  id: string;
  name: string;
  content: string;
}

interface FileExplorerProps {
  files: CodeFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
  onDuplicateFile: (id: string) => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconPy = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2C8 2 6 4 6 7v2h6v1H5c-2 0-3 1-3 4v4c0 2 2 4 4 4h2v-3c0-2 2-3 4-3s4 1 4 3v3h2c2 0 4-2 4-4v-4c0-3-1-4-3-4h-7V9h6V7c0-3-2-5-6-5z"/>
  </svg>
);

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconMore = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="5"  r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <circle cx="12" cy="19" r="2"/>
  </svg>
);

const IconEdit = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconCopy = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const IconTrash = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

function fileIcon(name: string) {
  if (name.endsWith(".py")) return <IconPy />;
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

interface MenuPos { right: number; top: number }

interface ContextMenuProps {
  pos: MenuPos;
  canDelete: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ContextMenu({ pos, canDelete, onRename, onDuplicate, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click — delayed so the opening click doesn't immediately dismiss
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    const timer = setTimeout(() => {
      function handler(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      }
      document.addEventListener("mousedown", handler);
      removeListener = () => document.removeEventListener("mousedown", handler);
    }, 0);
    return () => { clearTimeout(timer); removeListener?.(); };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", right: pos.right, top: pos.top }}
      className="z-[200] w-36 rounded-xl border border-white/[0.08] bg-[#0d0d1a] shadow-2xl shadow-black/60 overflow-hidden py-1"
    >
      <MenuItem icon={<IconEdit />} label="Rename" onClick={() => { onClose(); onRename(); }} />
      <MenuItem icon={<IconCopy />} label="Duplicate" onClick={() => { onClose(); onDuplicate(); }} />
      <div className="my-1 border-t border-white/[0.06]" />
      <MenuItem
        icon={<IconTrash />}
        label="Delete"
        danger
        disabled={!canDelete}
        title={!canDelete ? "Can't delete the last file" : undefined}
        onClick={() => { onClose(); onDelete(); }}
      />
    </div>,
    document.body
  );
}

function MenuItem({
  icon,
  label,
  danger,
  disabled,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "text-red-400 hover:bg-red-500/10 disabled:hover:bg-transparent"
          : "text-[--foreground] hover:bg-white/[0.06]"
      }`}
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </button>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({
  fileName,
  onConfirm,
  onCancel,
}: {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-6 shadow-2xl shadow-black/70 pointer-events-auto">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 shrink-0 mt-0.5">
              <IconTrash />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[--foreground]">Delete file?</p>
              <p className="text-xs text-[--muted] mt-0.5 break-all leading-relaxed">{fileName}</p>
            </div>
          </div>

          <p className="text-xs text-[--muted-light] leading-relaxed mb-5">
            This action cannot be undone. The file and all its contents will be permanently deleted.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-9 rounded-xl border border-white/[0.08] text-xs font-semibold text-[--muted-light] hover:text-[--foreground] hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 h-9 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onRenameFile,
  onDeleteFile,
  onDuplicateFile,
}: FileExplorerProps) {
  const [menuOpenId, setMenuOpenId]       = useState<string | null>(null);
  const [menuPos, setMenuPos]             = useState<MenuPos>({ right: 0, top: 0 });
  const [renamingId, setRenamingId]       = useState<string | null>(null);
  const [renameValue, setRenameValue]     = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Prevents blur from double-firing a commit after Enter/Escape already handled it
  const renameHandledRef = useRef(false);

  const openMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>, fileId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ right: window.innerWidth - rect.right, top: rect.bottom + 4 });
    setMenuOpenId(fileId);
  }, []);

  const startRename = useCallback((file: CodeFile) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  }, []);

  const commitRename = useCallback((fileId: string, value: string) => {
    const trimmed = value.trim();
    const original = files.find((f) => f.id === fileId)?.name;
    if (trimmed && trimmed !== original) onRenameFile(fileId, trimmed);
    setRenamingId(null);
  }, [files, onRenameFile]);

  const confirmDeleteFile = files.find((f) => f.id === confirmDeleteId) ?? null;

  return (
    <div className="flex flex-col h-full border-r border-white/[0.06] bg-[--surface]/60 backdrop-blur-md select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5 text-[--muted-light]">
          <IconFolder />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[--muted] select-none">
            Files
          </span>
        </div>
        <button
          type="button"
          onClick={onNewFile}
          title="New file"
          className="flex items-center justify-center w-5 h-5 rounded-md text-[--muted] hover:text-[--accent] hover:bg-[--accent-muted] transition-colors cursor-pointer"
        >
          <IconPlus />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        {files.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-[--muted]">
            No files yet
          </p>
        ) : (
          files.map((file) => {
            const isActive   = activeFileId === file.id;
            const isRenaming = renamingId === file.id;

            return (
              <div
                key={file.id}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg mx-2 transition-colors ${
                  isActive
                    ? "bg-white/[0.08] text-[--accent]"
                    : "text-[--muted-light] hover:bg-white/[0.05] hover:text-[--foreground]"
                }`}
                style={{ width: "calc(100% - 1rem)" }}
              >
                {/* File type icon */}
                <span className="shrink-0 opacity-60 pointer-events-none">
                  {fileIcon(isRenaming ? renameValue : file.name)}
                </span>

                {/* Name or rename input */}
                {isRenaming ? (
                  <input
                    type="text"
                    value={renameValue}
                    autoFocus
                    spellCheck={false}
                    className="flex-1 min-w-0 bg-transparent border-0 border-b border-[--accent] outline-none ring-0 text-xs text-[--foreground] pb-px"
                    style={{ caretColor: "var(--accent)" }}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        renameHandledRef.current = true;
                        commitRename(file.id, renameValue);
                      } else if (e.key === "Escape") {
                        renameHandledRef.current = true;
                        setRenamingId(null);
                      }
                    }}
                    onBlur={() => {
                      if (!renameHandledRef.current) {
                        commitRename(file.id, renameValue);
                      }
                      renameHandledRef.current = false;
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectFile(file.id)}
                    className="flex-1 min-w-0 text-xs text-left truncate cursor-pointer"
                  >
                    {file.name}
                  </button>
                )}

                {/* ⋮ menu trigger — visible on row hover */}
                {!isRenaming && (
                  <button
                    type="button"
                    onClick={(e) => openMenu(e, file.id)}
                    title="File options"
                    className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md opacity-0 group-hover:opacity-100 text-[--muted] hover:text-[--foreground] hover:bg-white/[0.08] transition-all cursor-pointer"
                  >
                    <IconMore />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Context menu — portaled to body to escape overflow-y-auto */}
      {menuOpenId && (
        <ContextMenu
          pos={menuPos}
          canDelete={files.length > 1}
          onRename={() => {
            const f = files.find((f) => f.id === menuOpenId);
            if (f) startRename(f);
          }}
          onDuplicate={() => {
            onDuplicateFile(menuOpenId);
            setMenuOpenId(null);
          }}
          onDelete={() => {
            setConfirmDeleteId(menuOpenId);
            setMenuOpenId(null);
          }}
          onClose={() => setMenuOpenId(null)}
        />
      )}

      {/* Delete confirmation modal — portaled to body */}
      {confirmDeleteId && confirmDeleteFile && (
        <DeleteModal
          fileName={confirmDeleteFile.name}
          onConfirm={() => {
            onDeleteFile(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
