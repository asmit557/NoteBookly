"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { signOut } from "next-auth/react";
import { usePdfTheme } from "@/app/components/providers/ThemeProvider";
import Button from "@/app/components/ui/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversionRecord {
  id: string;
  fileName: string;
  pdfUrl: string;
  publicId: string;
  theme: string;
  size: number;
  status: string;
  createdAt: string;
  userId: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface DashboardClientProps {
  user: UserInfo;
  initialConversions: ConversionRecord[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const MAX_SIZE = 5 * 1024 * 1024;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconDocument() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function IconPdfFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconSpinner() {
  return (
    <span className="block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function IconNotebook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

// ── Status / Theme badges ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const ok = status === "success";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
      ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`} />
      {ok ? "Success" : "Failed"}
    </span>
  );
}

function ThemeBadge({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[--accent-muted] text-[--accent]">
      {theme === "dark" ? <IconMoon /> : <IconSun />}
      {theme.charAt(0).toUpperCase() + theme.slice(1)} PDF
    </span>
  );
}

// ── Drag-over overlay ─────────────────────────────────────────────────────────

function DragOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(8,8,16,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-[--accent] bg-[--accent-muted]/20" />
          <span className="relative z-10 font-mono text-sm font-semibold text-[--accent] tracking-widest">
            Drop to convert
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const isNumber = typeof value === "number";

  useEffect(() => {
    if (!isNumber) return;
    const n = value as number;
    if (n === 0) { setDisplayed(0); return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(n / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, n);
      setDisplayed(current);
      if (current >= n) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value, isNumber]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className={`rounded-xl border p-5 flex flex-col gap-2 ${
        accent
          ? "bg-[--accent-muted] border-[--accent]/25"
          : "bg-[--surface] border-[--border]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[--muted-light]">
          {label}
        </span>
        <span className={accent ? "text-[--accent]" : "text-[--muted]"}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-[--foreground]">
        {isNumber ? displayed : value}
      </div>
    </motion.div>
  );
}

// ── Conversion card ───────────────────────────────────────────────────────────

function ConversionCard({
  c,
  isDeleting,
  onDelete,
}: {
  c: ConversionRecord;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: isDeleting ? 0.4 : 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9, y: -8, filter: "blur(8px)" }}
      transition={{ duration: 0.3, ease: EASE }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="rounded-xl border border-[--border] bg-[--surface] p-4 flex flex-col gap-3 hover:border-[--accent]/25 transition-colors"
    >
      {/* File info */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--accent-muted] text-[--accent] shrink-0">
          <IconPdfFile />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[--foreground] truncate" title={c.fileName}>
            {c.fileName}
          </p>
          <p className="text-[11px] text-[--muted] mt-0.5">{formatSize(c.size)}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatusBadge status={c.status} />
        <ThemeBadge theme={c.theme} />
        <span className="ml-auto text-[11px] text-[--muted] shrink-0">
          {formatRelativeTime(c.createdAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[--border]">
        <a
          href={c.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs font-semibold bg-[--accent-muted] text-[--accent] hover:bg-[--accent] hover:text-white transition-all"
        >
          <IconDownload />
          Open PDF
        </a>
        <button
          type="button"
          onClick={() => onDelete(c.id)}
          disabled={isDeleting}
          title="Delete"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-[--muted] hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 cursor-pointer"
        >
          <IconTrash />
        </button>
      </div>
    </motion.div>
  );
}

// ── Quick upload zone ─────────────────────────────────────────────────────────

function QuickUpload({
  uploading,
  error,
  onUpload,
}: {
  uploading: boolean;
  error: string | null;
  onUpload: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
      className="rounded-xl border border-dashed border-[--border-strong] bg-[--surface] p-5 hover:border-[--accent]/40 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-colors ${
            uploading ? "bg-[--accent-muted] text-[--accent]" : "bg-[--surface-hover] text-[--muted-light]"
          }`}
        >
          {uploading ? <IconSpinner /> : <IconUpload />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[--foreground]">
            {uploading ? "Converting notebook…" : "New Conversion"}
          </p>
          <p className="text-xs text-[--muted] mt-0.5">
            {uploading
              ? "Generating your PDF — please wait up to 30s"
              : "Drop a .ipynb file anywhere or click Upload"}
          </p>
        </div>
        {!uploading && (
          <Button variant="secondary" size="sm" onClick={onUpload}>
            Upload
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-3 text-xs text-red-400 font-mono rounded-lg bg-red-500/8 px-3 py-2">
          {error}
        </p>
      )}
    </motion.div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({ last }: { last: ConversionRecord | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.2 }}
      className="rounded-xl border border-[--border] bg-[--surface] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--border]">
        <span className="text-xs font-semibold text-[--foreground] tracking-wide">Last PDF</span>
        {last && (
          <a
            href={last.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-[--accent] hover:underline"
          >
            Open ↗
          </a>
        )}
      </div>

      {last ? (
        <div className="p-4">
          <div className="rounded-lg bg-[--background] border border-[--border] p-5 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--accent-muted] text-[--accent]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <div className="w-full">
              <p className="text-sm font-semibold text-[--foreground] truncate">{last.fileName}</p>
              <p className="text-[11px] text-[--muted] mt-1">
                {formatSize(last.size)} · {formatRelativeTime(last.createdAt)}
              </p>
            </div>
            <ThemeBadge theme={last.theme} />
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--surface-hover] text-[--muted]">
            <IconDocument />
          </div>
          <p className="text-xs text-[--muted]">No PDFs generated yet</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Activity timeline ─────────────────────────────────────────────────────────

function ActivityTimeline({ items }: { items: ConversionRecord[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.3 }}
      className="rounded-xl border border-[--border] bg-[--surface] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[--border]">
        <span className="text-xs font-semibold text-[--foreground] tracking-wide">Activity</span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-[--muted]">No activity yet</p>
        </div>
      ) : (
        <div className="p-2 flex flex-col">
          {items.map((c, i) => (
            <div key={c.id} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-[--surface-hover] transition-colors">
              {/* Timeline dot + connector */}
              <div className="flex flex-col items-center gap-0 shrink-0 pt-0.5">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center ${
                    c.status === "success"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {c.status === "success" ? (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </div>
                {i < items.length - 1 && (
                  <div className="w-px h-4 mt-0.5" style={{ background: "var(--border)" }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-xs font-medium text-[--foreground] truncate">{c.fileName}</p>
                <p className="text-[10px] text-[--muted] mt-0.5">
                  {c.theme.charAt(0).toUpperCase() + c.theme.slice(1)} PDF · {formatRelativeTime(c.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.3 }}
      className="rounded-xl border border-dashed border-[--border] bg-[--surface] p-12 flex flex-col items-center gap-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[--accent-muted] text-[--accent]">
        <IconNotebook />
      </div>
      <div>
        <p className="text-base font-semibold text-[--foreground]">No conversions yet</p>
        <p className="text-sm text-[--muted-light] mt-2 max-w-sm">
          Upload a Jupyter notebook to turn it into a beautiful, styled PDF in seconds
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onUpload}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload your first notebook
      </Button>
    </motion.div>
  );
}

// ── Conversions grid ──────────────────────────────────────────────────────────

function ConversionsGrid({
  conversions,
  deletingId,
  onDelete,
}: {
  conversions: ConversionRecord[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[--foreground]">Recent Conversions</h2>
        <span className="text-xs text-[--muted]">
          {conversions.length} file{conversions.length !== 1 ? "s" : ""}
        </span>
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {conversions.map((c) => (
            <ConversionCard
              key={c.id}
              c={c}
              isDeleting={deletingId === c.id}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Main dashboard component ──────────────────────────────────────────────────

export default function DashboardClient({ user, initialConversions }: DashboardClientProps) {
  const [conversions, setConversions] = useState<ConversionRecord[]>(initialConversions);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pdfTheme, togglePdfTheme } = usePdfTheme();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".ipynb")) {
        setUploadError("Only .ipynb files are supported.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setUploadError("File must be under 5 MB.");
        return;
      }

      setUploadError(null);
      setUploading(true);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("theme", pdfTheme);

        const res = await fetch("/api/convert", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? "Conversion failed.");
        }

        // Trigger PDF download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(/\.ipynb$/, ".pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        // Refresh conversion list from DB
        const convRes = await fetch("/api/conversions");
        if (convRes.ok) {
          const data = (await convRes.json()) as { conversions: ConversionRecord[] };
          setConversions(data.conversions);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [pdfTheme]
  );

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setConversions((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Derived stats
  const total = conversions.length;
  const successful = conversions.filter((c) => c.status === "success").length;
  const lastActivity = conversions[0]?.createdAt ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div
      className="min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ipynb"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <DragOverlay active={dragOver} />

      <div className="container py-8">
        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[--foreground]">
              {greeting},{" "}
              <span className="gradient-accent">{firstName}</span>
            </h1>
            <p className="text-sm text-[--muted-light] mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={togglePdfTheme}
              title={`PDF theme: ${pdfTheme}`}
              className="flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium text-[--muted-light] hover:text-[--foreground] hover:bg-[--surface] border border-[--border] transition-all cursor-pointer select-none"
            >
              {pdfTheme === "dark" ? <IconMoon /> : <IconSun />}
              <span className="hidden sm:inline">{pdfTheme === "dark" ? "Dark" : "Light"} PDF</span>
            </button>

            <a
              href="/"
              className="flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium text-[--muted-light] hover:text-[--foreground] hover:bg-[--surface] border border-[--border] transition-all"
            >
              ← Home
            </a>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Conversions"
            value={total}
            icon={<IconDocument />}
            delay={0.05}
          />
          <StatCard
            label="Successful"
            value={successful}
            icon={<IconCheck />}
            delay={0.1}
          />
          <StatCard
            label="Last Activity"
            value={lastActivity ? formatRelativeTime(lastActivity) : "Never"}
            icon={<IconClock />}
            delay={0.15}
          />
          <StatCard
            label="PDF Theme"
            value={pdfTheme.charAt(0).toUpperCase() + pdfTheme.slice(1)}
            icon={pdfTheme === "dark" ? <IconMoon /> : <IconSun />}
            accent
            delay={0.2}
          />
        </div>

        {/* ── Main content (2-col) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: upload + conversions */}
          <div className="flex flex-col gap-6">
            <QuickUpload
              uploading={uploading}
              error={uploadError}
              onUpload={() => fileInputRef.current?.click()}
            />

            {conversions.length === 0 ? (
              <EmptyState onUpload={() => fileInputRef.current?.click()} />
            ) : (
              <ConversionsGrid
                conversions={conversions}
                deletingId={deletingId}
                onDelete={handleDelete}
              />
            )}
          </div>

          {/* Right: preview + timeline */}
          <div className="flex flex-col gap-6">
            <PreviewPanel last={conversions[0] ?? null} />
            <ActivityTimeline items={conversions.slice(0, 8)} />
          </div>
        </div>
      </div>
    </div>
  );
}
