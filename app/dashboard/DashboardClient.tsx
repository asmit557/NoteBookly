"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { usePdfTheme } from "@/app/components/providers/ThemeProvider";
import Button from "@/app/components/ui/Button";

// Lazy-load 3D background (WebGL, client only)
const DashboardBackground = dynamic(
  () => import("./DashboardBackground"),
  { ssr: false, loading: () => null }
);

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

// ── Animation constants ───────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.55, ease: EASE, delay },
});

const fadeRight = (delay = 0) => ({
  initial: { opacity: 0, x: 18, filter: "blur(8px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  transition: { duration: 0.55, ease: EASE, delay },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_SIZE = 5 * 1024 * 1024;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconDocument = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const IconSun = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const IconMoon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const IconPdfFile = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconUpload = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17,8 12,3 7,8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconSpinner = () => (
  <span className="block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const IconNotebook = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const IconLogOut = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const ok = status === "success";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
        ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
      {ok ? "Success" : "Failed"}
    </span>
  );
}

function ThemeBadge({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[--accent-muted] text-[--accent]">
      {theme === "dark" ? <IconMoon size={10} /> : <IconSun size={10} />}
      {theme.charAt(0).toUpperCase() + theme.slice(1)} PDF
    </span>
  );
}

// ── Drag overlay ──────────────────────────────────────────────────────────────

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
          style={{ background: "rgba(8,8,16,0.75)", backdropFilter: "blur(6px)" }}
        >
          <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-[--accent] bg-[--accent-muted]/15" />
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
      {...fadeUp(delay)}
      className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 h-full ${
        accent
          ? "bg-[--accent-muted] border-[--accent]/30"
          : "bg-[--surface]/80 border-[--border] backdrop-blur-sm"
      }`}
    >
      {/* Subtle top glow line for accent card */}
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(108,99,255,0.7), transparent)",
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase text-[--muted]">
          {label}
        </span>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            accent ? "bg-[--accent]/20 text-[--accent]" : "bg-[--surface-hover] text-[--muted-light]"
          }`}
        >
          {icon}
        </div>
      </div>

      <div className="text-3xl font-bold tracking-tight text-[--foreground]">
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
      initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      animate={{ opacity: isDeleting ? 0.35 : 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
      transition={{ duration: 0.28, ease: EASE }}
      whileHover={{ y: -3, transition: { duration: 0.16 } }}
      className="group relative rounded-2xl border border-[--border] bg-[--surface]/80 backdrop-blur-sm p-4 flex flex-col gap-3 hover:border-[--accent]/30 transition-colors overflow-hidden"
    >
      {/* Hover glow line */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(108,99,255,0.5), transparent)",
        }}
      />

      {/* File info */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--accent-muted] text-[--accent] shrink-0">
          <IconPdfFile />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold text-[--foreground] truncate leading-tight"
            title={c.fileName}
          >
            {c.fileName}
          </p>
          <p className="text-[11px] text-[--muted] mt-1">{formatSize(c.size)}</p>
        </div>
      </div>

      {/* Badges + timestamp */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatusBadge status={c.status} />
        <ThemeBadge theme={c.theme} />
        <span className="ml-auto text-[11px] text-[--muted] shrink-0 tabular-nums">
          {formatRelativeTime(c.createdAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[--border]">
        <a
          href={c.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-semibold bg-[--accent-muted] text-[--accent] hover:bg-[--accent] hover:text-white transition-all duration-200"
        >
          <IconDownload />
          Open PDF
        </a>
        <button
          type="button"
          onClick={() => onDelete(c.id)}
          disabled={isDeleting}
          title="Delete"
          className="flex items-center justify-center w-8 h-8 rounded-xl text-[--muted] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-40 cursor-pointer"
        >
          <IconTrash />
        </button>
      </div>
    </motion.div>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────

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
      {...fadeUp(0.22)}
      onClick={!uploading ? onUpload : undefined}
      className={`group relative rounded-2xl border bg-[--surface]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
        uploading
          ? "border-[--accent]/40 cursor-default"
          : "border-dashed border-[--border-strong] hover:border-[--accent]/50 cursor-pointer"
      }`}
    >
      {/* Animated accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(108,99,255,0.06), transparent)",
        }}
      />

      <div className="relative flex flex-col items-center gap-5 px-8 py-10 text-center">
        <div
          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
            uploading
              ? "bg-[--accent-muted] text-[--accent]"
              : "bg-[--surface-hover] text-[--muted-light] group-hover:bg-[--accent-muted] group-hover:text-[--accent]"
          }`}
        >
          {uploading ? <IconSpinner /> : <IconUpload />}
          {/* Ping ring when idle */}
          {!uploading && (
            <span
              className="absolute inset-0 rounded-2xl border-2 border-[--accent] opacity-0 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500"
            />
          )}
        </div>

        <div>
          <p className="text-base font-semibold text-[--foreground]">
            {uploading ? "Converting notebook…" : "Upload a Notebook"}
          </p>
          <p className="text-sm text-[--muted] mt-1.5 max-w-xs">
            {uploading
              ? "Generating your PDF — please wait up to 30 seconds"
              : "Drag & drop a .ipynb file anywhere on this page, or click to browse"}
          </p>
        </div>

        {!uploading && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onUpload(); }}
          >
            Choose file
          </Button>
        )}
      </div>

      {error && (
        <div className="border-t border-[--border] px-6 py-3">
          <p className="text-xs text-red-400 font-mono text-center">{error}</p>
        </div>
      )}
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[--foreground]">Recent Conversions</p>
        <span className="text-xs text-[--muted] tabular-nums">
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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      {...fadeUp(0.3)}
      className="rounded-2xl border border-dashed border-[--border] bg-[--surface]/60 backdrop-blur-sm p-16 flex flex-col items-center gap-6 text-center"
    >
      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-[--accent-muted] text-[--accent]">
        <IconNotebook />
        <div
          className="absolute inset-0 rounded-3xl"
          style={{ boxShadow: "0 0 40px rgba(108,99,255,0.15)" }}
        />
      </div>
      <div>
        <p className="text-lg font-semibold text-[--foreground]">No conversions yet</p>
        <p className="text-sm text-[--muted-light] mt-2 max-w-xs leading-relaxed">
          Upload a Jupyter notebook to turn it into a beautiful, styled PDF in seconds
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onUpload}>
        <IconUpload />
        Upload your first notebook
      </Button>
    </motion.div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({ last }: { last: ConversionRecord | null }) {
  return (
    <motion.div
      {...fadeRight(0.18)}
      className="rounded-2xl border border-[--border] bg-[--surface]/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[--border]">
        <span className="text-xs font-bold tracking-wider uppercase text-[--muted-light]">
          Last PDF
        </span>
        {last && (
          <a
            href={last.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold text-[--accent] hover:underline"
          >
            Open ↗
          </a>
        )}
      </div>

      {last ? (
        <div className="p-4">
          <div className="rounded-xl bg-[--background]/80 border border-[--border] p-5 flex flex-col items-center gap-3 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--accent-muted] text-[--accent]"
              style={{ boxShadow: "0 0 24px rgba(108,99,255,0.2)" }}
            >
              <svg
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <div className="w-full">
              <p className="text-sm font-semibold text-[--foreground] truncate">
                {last.fileName}
              </p>
              <p className="text-[11px] text-[--muted] mt-1">
                {formatSize(last.size)} · {formatRelativeTime(last.createdAt)}
              </p>
            </div>
            <ThemeBadge theme={last.theme} />
          </div>
        </div>
      ) : (
        <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
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
      {...fadeRight(0.28)}
      className="rounded-2xl border border-[--border] bg-[--surface]/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 py-3.5 border-b border-[--border]">
        <span className="text-xs font-bold tracking-wider uppercase text-[--muted-light]">
          Activity
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-[--muted]">No activity yet</p>
        </div>
      ) : (
        <div className="p-2">
          {items.map((c, i) => (
            <div
              key={c.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[--surface-hover] transition-colors"
            >
              {/* Dot + connector */}
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                    c.status === "success"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {c.status === "success" ? (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </div>
                {i < items.length - 1 && (
                  <div
                    className="w-px flex-1 mt-1 min-h-[12px]"
                    style={{ background: "var(--border)" }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-0.5">
                <p className="text-xs font-medium text-[--foreground] truncate leading-tight">
                  {c.fileName}
                </p>
                <p className="text-[10px] text-[--muted] mt-0.5">
                  {c.theme.charAt(0).toUpperCase() + c.theme.slice(1)} ·{" "}
                  {formatRelativeTime(c.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardClient({
  user,
  initialConversions,
}: DashboardClientProps) {
  const [conversions, setConversions] =
    useState<ConversionRecord[]>(initialConversions);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pdfTheme, togglePdfTheme } = usePdfTheme();

  // ── Upload handler ──────────────────────────────────────────────────────────
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

        // Trigger browser download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(/\.ipynb$/, ".pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        // Refresh list from DB
        const convRes = await fetch("/api/conversions");
        if (convRes.ok) {
          const data = (await convRes.json()) as {
            conversions: ConversionRecord[];
          };
          setConversions(data.conversions);
        }
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Upload failed."
        );
      } finally {
        setUploading(false);
      }
    },
    [pdfTheme]
  );

  // ── Delete handler ──────────────────────────────────────────────────────────
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

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the window
    if (!e.relatedTarget) setDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const total = conversions.length;
  const successful = conversions.filter((c) => c.status === "success").length;
  const lastActivity = conversions[0]?.createdAt ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div
      className="relative min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 3D animated background */}
      <DashboardBackground />

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

      {/* ── Content (above 3D background) ── */}
      <div className="relative z-10">
        <div className="container py-8 pb-16">

          {/* ── Page header ── */}
          <motion.div
            {...fadeUp(0)}
            className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            {/* Greeting */}
            <div>
              {/* Use div, not h1, to avoid globals.css h1 font-size override */}
              <div className="text-[1.75rem] font-bold tracking-tight leading-tight text-[--foreground]">
                {greeting},{" "}
                <span className="gradient-accent">{firstName}</span>
              </div>
              <p className="text-sm text-[--muted-light] mt-1.5">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* PDF theme toggle */}
              <button
                type="button"
                onClick={togglePdfTheme}
                title={`Switch PDF theme (current: ${pdfTheme})`}
                className="flex items-center gap-2 h-8 rounded-lg px-3 text-xs font-medium text-[--muted-light] hover:text-[--foreground] hover:bg-[--surface] border border-[--border] transition-all cursor-pointer select-none backdrop-blur-sm"
              >
                {pdfTheme === "dark" ? <IconMoon /> : <IconSun />}
                <span className="hidden sm:inline">
                  {pdfTheme === "dark" ? "Dark" : "Light"} PDF
                </span>
              </button>

              {/* Sign out */}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 h-8 rounded-lg px-3 text-xs font-medium text-[--muted-light] hover:text-[--foreground] hover:bg-[--surface] border border-[--border] transition-all cursor-pointer backdrop-blur-sm"
              >
                <IconLogOut />
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {/* Home */}
              <a
                href="/"
                className="flex items-center gap-2 h-8 rounded-lg px-3 text-xs font-medium text-[--muted-light] hover:text-[--foreground] hover:bg-[--surface] border border-[--border] transition-all backdrop-blur-sm"
              >
                <IconArrowLeft />
                <span className="hidden sm:inline">Home</span>
              </a>
            </div>
          </motion.div>

          {/* ── Stats row (4 equal cols) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Conversions"
              value={total}
              icon={<IconDocument />}
              delay={0.06}
            />
            <StatCard
              label="Successful"
              value={successful}
              icon={<IconCheck />}
              delay={0.12}
            />
            <StatCard
              label="Last Activity"
              value={lastActivity ? formatRelativeTime(lastActivity) : "Never"}
              icon={<IconClock />}
              delay={0.18}
            />
            <StatCard
              label="PDF Theme"
              value={
                pdfTheme.charAt(0).toUpperCase() + pdfTheme.slice(1)
              }
              icon={pdfTheme === "dark" ? <IconMoon size={16} /> : <IconSun size={16} />}
              accent
              delay={0.24}
            />
          </div>

          {/* ── Main 2-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

            {/* Left column */}
            <div className="flex flex-col gap-6 min-w-0">
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

            {/* Right sidebar */}
            <div className="flex flex-col gap-5 min-w-0">
              <PreviewPanel last={conversions[0] ?? null} />
              <ActivityTimeline items={conversions.slice(0, 8)} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
