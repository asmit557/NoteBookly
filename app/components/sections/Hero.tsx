"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import Button from "../ui/Button";

const HeroScene = dynamic(() => import("../3d/HeroScene"), {
  ssr: false,
  loading: () => null,
});

/* ── Entrance variants ─────────────────────────────────── */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
};
const itemSlow = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};

/* ── Conversion animation data ─────────────────────────── */
const WORDS = [
  { id: "cells",    label: "cells",    x: -210, y: -75,  o: 0.48, blur: 0,   size: "text-sm", delay: 0.00, amp: 10, dur: 3.8 },
  { id: "outputs",  label: "outputs",  x:  200, y: -62,  o: 0.30, blur: 1.5, size: "text-xs", delay: 0.06, amp: 8,  dur: 4.4 },
  { id: "LaTeX",    label: "LaTeX",    x: -178, y:  85,  o: 0.42, blur: 0,   size: "text-sm", delay: 0.04, amp: 12, dur: 3.4 },
  { id: "graphs",   label: "graphs",   x:  182, y:  82,  o: 0.28, blur: 1,   size: "text-xs", delay: 0.10, amp: 9,  dur: 5.0 },
  { id: "markdown", label: "markdown", x:    6, y:  128, o: 0.26, blur: 1.5, size: "text-xs", delay: 0.07, amp: 7,  dur: 4.2 },
  { id: "json",     label: ".json",    x: -268, y:    6, o: 0.14, blur: 2.5, size: "text-xs", delay: 0.03, amp: 6,  dur: 4.8 },
  { id: "plots",    label: "plots",    x:  260, y:    8, o: 0.13, blur: 2,   size: "text-xs", delay: 0.09, amp: 8,  dur: 3.6 },
] as const;

/* ── Blinking cursor ───────────────────────────────────── */
function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 520);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="inline-block w-[2px] h-[1em] ml-1 align-middle rounded-sm"
      style={{ background: "var(--accent)", opacity: on ? 1 : 0, transition: "opacity 0.08s" }}
    />
  );
}

/* ── Scan line ─────────────────────────────────────────── */
function ScanLine({ active }: { active: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-[10%] h-px"
      style={{ background: "linear-gradient(90deg,transparent,rgba(108,99,255,0.55),rgba(108,99,255,0.85),rgba(108,99,255,0.55),transparent)" }}
      initial={{ top: "20%", opacity: 0 }}
      animate={active ? { top: ["20%", "80%"], opacity: [0, 0.85, 0.85, 0] } : { opacity: 0 }}
      transition={active ? { duration: 0.48, ease: "easeInOut", times: [0, 0.1, 0.9, 1] } : { duration: 0.15 }}
    />
  );
}

/* ── Floating keyword ──────────────────────────────────── */
function FloatingWord({ label, x, y, o, blur, size, delay, amp, dur, hovered }: (typeof WORDS)[number] & { hovered: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none font-mono text-[--muted-light] whitespace-nowrap ${size}`}
      initial={{ x, y: y + 10, opacity: 0, filter: `blur(${blur + 4}px)` }}
      animate={
        hovered
          ? { x: 0, y: -8, opacity: 0, filter: "blur(10px)", scale: 0.7, transition: { duration: 0.42, ease: EASE_IN, delay } }
          : reduced
          ? { x, y, opacity: o, filter: `blur(${blur}px)`, scale: 1 }
          : {
              x, y: [y, y - amp, y], opacity: o, filter: `blur(${blur}px)`, scale: 1,
              transition: {
                x: { duration: 0.55, ease: EASE, delay: delay + 0.1 },
                y: { duration: dur, repeat: Infinity, ease: "easeInOut", repeatType: "mirror", delay },
                opacity: { duration: 0.5, delay: delay + 0.1 },
                filter: { duration: 0.5, delay: delay + 0.1 },
              },
            }
      }
    >
      {label}
    </motion.span>
  );
}

/* ── Central labels ────────────────────────────────────── */
const labelEase = [0.16, 1, 0.3, 1] as const;

function NotebookLabel() {
  return (
    <motion.div
      key="nb"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center whitespace-nowrap"
      initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
      transition={{ duration: 0.38, ease: labelEase }}
    >
      <span className="font-mono text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold tracking-tight gradient-text">notebook</span>
      <span className="font-mono text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold tracking-tight text-[--muted]">.ipynb</span>
      <Cursor />
    </motion.div>
  );
}

function PdfLabel() {
  return (
    <motion.div
      key="pdf"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 whitespace-nowrap"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.42, ease: labelEase, delay: 0.26 }}
    >
      <span className="font-mono text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold tracking-tight text-[--foreground]">document</span>
      <span className="font-mono text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold tracking-tight" style={{ color: "#ef4444" }}>.pdf</span>
      <motion.span
        className="text-[10px] font-sans font-normal text-[--muted] tracking-widest uppercase"
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.52, duration: 0.35 }}
      >
        ready
      </motion.span>
    </motion.div>
  );
}

/* ── Upload icon ───────────────────────────────────────── */
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1v9M4.5 6.5 8 10l3.5-3.5M2 12.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Hero ──────────────────────────────────────────────── */
const MAX_SIZE = 5 * 1024 * 1024;

type Status = "idle" | "loading" | "error";

export default function Hero() {
  const reduced = useReducedMotion();
  const { data: session } = useSession();
  const authed = !!session?.user;
  const [hovered, setHovered] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleEnter() {
    setHovered(true);
    setScanning(true);
    setTimeout(() => setScanning(false), 550);
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.name.endsWith(".ipynb")) {
      setError("Only .ipynb files are supported.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File must be under 5MB.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/convert", { method: "POST", body: form });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Conversion failed.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.ipynb$/, ".pdf");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (authed) setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!authed) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const loading = status === "loading";

  return (
    <section
      className="relative flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden"
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
        onChange={handleInputChange}
        aria-hidden
      />

      {/* 3D background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <HeroScene />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%,black 20%,transparent 100%)",
        }}
      />

      {/* Drag-over overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-[--accent] bg-[--accent-muted]" style={{ backdropFilter: "blur(2px)" }} />
            <span className="relative z-10 font-mono text-sm text-[--accent] tracking-widest">Drop to convert</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero content ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-5 sm:px-8 pt-10 pb-10 mb-4">
        <motion.div
          className="flex flex-col items-center gap-12 max-w-4xl mx-auto"
          variants={reduced ? undefined : container}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={reduced ? undefined : item}>
            <span className="inline-flex items-center gap-2 rounded-full bg-[--surface] px-4 py-1.5 text-xs font-medium text-[--muted-light] tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-[--accent]" />
              Jupyter · Colab · Quarto
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
            <motion.span className="gradient-text block" variants={reduced ? undefined : item}>
              Turn Notebooks into
            </motion.span>
            <motion.span className="gradient-accent block" variants={reduced ? undefined : item}>
              Beautiful PDFs
            </motion.span>
          </h1>

          {/* Subtext */}
          <motion.p variants={reduced ? undefined : itemSlow} className="max-w-xl text-lg text-[--muted-light]">
            Upload any Jupyter notebook and get a clean, styled PDF in seconds —
            no setup, no CLI, no friction.
          </motion.p>

          {/* CTA */}
          <motion.div variants={reduced ? undefined : itemSlow} className="flex flex-col items-center gap-3 pt-8">
            {authed ? (
              <Button 
              className="z-50"
                size="lg"
                variant="primary"
                loading={loading}
                onClick={() => fileInputRef.current?.click()}
              >
                {!loading && <UploadIcon />}
                {loading ? "Converting…" : "Upload Notebook"}
              </Button>
            ) : (
              <Button
                className="z-50"
                size="lg"
                variant="primary"
                onClick={() => signIn("google")}
              >
                Sign in to Upload
              </Button>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  className="text-xs text-red-400 font-mono max-w-xs text-center"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {authed ? (
              <motion.p
                className="text-[11px] text-[--muted] tracking-wide"
                animate={{ opacity: dragOver ? 0 : 1 }}
              >
                or drag & drop a .ipynb file anywhere
              </motion.p>
            ) : (
              <p className="text-[11px] text-[--muted] tracking-wide">
                Sign in with Google to start converting notebooks
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Conversion animation ── */}
      <div
        className="absolute left-1/2 top-[90%] -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-xl"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative h-[260px] w-full">
          <ScanLine active={scanning} />
          {WORDS.map(w => <FloatingWord key={w.id} {...w} hovered={hovered} />)}
          <AnimatePresence mode="wait">
            {hovered ? <PdfLabel /> : <NotebookLabel />}
          </AnimatePresence>
          <AnimatePresence>
            {scanning && (
              <motion.span
                key="converting"
                className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] text-[--accent] tracking-widest"
                style={{ top: "calc(50% + 34px)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                → converting
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[--background] to-transparent" />
    </section>
  );
}
