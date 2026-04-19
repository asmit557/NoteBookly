"use client";

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
}

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

function fileIcon(name: string) {
  if (name.endsWith(".py")) return <IconPy />;
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>
  );
}

export default function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
}: FileExplorerProps) {
  return (
    <div className="flex flex-col h-full border-r border-[--border] bg-[--surface]/80 backdrop-blur-sm select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[--border] shrink-0">
        <div className="flex items-center gap-1.5 text-[--muted-light]">
          <IconFolder />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[--muted]">
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
          files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => onSelectFile(file.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left truncate transition-colors cursor-pointer ${
                activeFileId === file.id
                  ? "bg-[--accent-muted] text-[--accent]"
                  : "text-[--muted-light] hover:bg-[--surface-hover] hover:text-[--foreground]"
              }`}
            >
              <span className="shrink-0 opacity-70">{fileIcon(file.name)}</span>
              <span className="truncate">{file.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
