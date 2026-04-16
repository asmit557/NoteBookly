"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

/* ─── Keyword config ─────────────────────────────────────── */
const WORDS = [
  { id: "cells",    label: "cells",    x: -220, y: -80,  o: 0.50, blur: 0,   size: "text-sm",  delay: 0.00, floatAmp: 10, floatDur: 3.8 },
  { id: "outputs",  label: "outputs",  x:  210, y: -65,  o: 0.32, blur: 1.5, size: "text-xs",  delay: 0.06, floatAmp: 8,  floatDur: 4.4 },
  { id: "LaTeX",    label: "LaTeX",    x: -185, y:  90,  o: 0.44, blur: 0,   size: "text-sm",  delay: 0.04, floatAmp: 12, floatDur: 3.4 },
  { id: "graphs",   label: "graphs",   x:  190, y:  88,  o: 0.30, blur: 1,   size: "text-xs",  delay: 0.10, floatAmp: 9,  floatDur: 5.0 },
  { id: "markdown", label: "markdown", x:    8, y:  138, o: 0.28, blur: 1.5, size: "text-xs",  delay: 0.07, floatAmp: 7,  floatDur: 4.2 },
  { id: "json",     label: ".json",    x: -300, y:   8,  o: 0.18, blur: 2.5, size: "text-xs",  delay: 0.03, floatAmp: 6,  floatDur: 4.8 },
  { id: "plots",    label: "plots",    x:  290, y:  10,  o: 0.16, blur: 2,   size: "text-xs",  delay: 0.09, floatAmp: 8,  floatDur: 3.6 },
] as const;

/* ─── FloatingWord ───────────────────────────────────────── */
function FloatingWord({
  label, x, y, o, blur, size, delay, floatAmp, floatDur, hovered,
}: (typeof WORDS)[number] & { hovered: boolean }) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none font-mono font-normal text-[--muted-light] whitespace-nowrap ${size} mb-4`}
      initial={{ x, y: y + 12, opacity: 0, filter: `blur(${blur + 4}px)` }}
      animate={
        hovered
          ? {
              x: 0,
              y: -10,
              opacity: 0,
              filter: "blur(10px)",
              scale: 0.7,
              transition: {
                duration: 0.45,
                ease: [0.4, 0, 1, 1],
                delay,
              },
            }
          : reduced
          ? { x, y, opacity: o, filter: `blur(${blur}px)`, scale: 1 }
          : {
              x,
              y: [y, y - floatAmp, y],
              opacity: o,
              filter: `blur(${blur}px)`,
              scale: 1,
              transition: {
                x: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: delay + 0.15 },
                y: { duration: floatDur, repeat: Infinity, ease: "easeInOut", repeatType: "mirror", delay },
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

/* ─── Blinking cursor ────────────────────────────────────── */
function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn(v => !v), 520);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="inline-block w-[2px] h-[1.1em] ml-1 align-middle bg-[--accent] rounded-sm"
      style={{ opacity: on ? 1 : 0, transition: "opacity 0.1s" }}
    />
  );
}

/* ─── Scan line ──────────────────────────────────────────── */
function ScanLine({ active }: { active: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-[15%] h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(108,99,255,0.6), rgba(108,99,255,0.9), rgba(108,99,255,0.6), transparent)",
      }}
      initial={{ top: "20%", opacity: 0 }}
      animate={
        active
          ? { top: ["20%", "80%"], opacity: [0, 0.9, 0.9, 0] }
          : { opacity: 0 }
      }
      transition={active ? { duration: 0.5, ease: "easeInOut", times: [0, 0.1, 0.9, 1] } : { duration: 0.2 }}
    />
  );
}

/* ─── Central label ──────────────────────────────────────── */
const labelEase = [0.16, 1, 0.3, 1] as const;

function NotebookLabel() {
  return (
    <motion.div
      key="notebook"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-0 whitespace-nowrap"
      initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
      transition={{ duration: 0.4, ease: labelEase }}
    >
      <span className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold tracking-tight gradient-text">
        notebook
      </span>
      <span className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold tracking-tight text-[--muted]">
        .ipynb
      </span>
      <Cursor />
    </motion.div>
  );
}

function PdfLabel() {
  return (
    <motion.div
      key="pdf"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-0 whitespace-nowrap"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: labelEase, delay: 0.28 }}
    >
      <span className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold tracking-tight text-[--foreground]">
        document
      </span>
      <span
        className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold tracking-tight"
        style={{ color: "#ef4444" }}
      >
        .pdf
      </span>
      {/* Ready indicator */}
      <motion.span
        className="ml-3 text-xs font-sans font-normal text-[--muted] tracking-widest uppercase"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        ready
      </motion.span>
    </motion.div>
  );
}

/* ─── Section ────────────────────────────────────────────── */
export default function ConversionSection() {
  const [hovered, setHovered] = useState(false);
  const [scanning, setScanning] = useState(false);

  function handleEnter() {
    setHovered(true);
    setScanning(true);
    setTimeout(() => setScanning(false), 600);
  }

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Edge fades — blend with page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: "linear-gradient(to bottom, var(--background), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(to top, var(--background), transparent)" }}
      />

      {/* Ambient glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          width:  hovered ? 480 : 320,
          height: hovered ? 320 : 200,
          opacity: hovered ? 1 : 0.6,
        }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background:
            "radial-gradient(ellipse, rgba(108,99,255,0.1) 0%, rgba(108,99,255,0.04) 50%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />

      {/* Interaction area */}
      <div className="container mx-auto">
        <div
          className="relative mx-auto"
          style={{ height: 340, maxWidth: 680 }}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Scan line */}
          <ScanLine active={scanning} />

          {/* Floating keywords */}
          {WORDS.map(w => (
            <FloatingWord key={w.id} {...w} hovered={hovered} />
          ))}

          {/* Central text */}
          <AnimatePresence mode="wait">
            {hovered ? <PdfLabel /> : <NotebookLabel />}
          </AnimatePresence>

          {/* Arrow — visible mid-transition only */}
          <AnimatePresence>
            {scanning && (
              <motion.span
                key="arrow"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none"
                style={{ top: "calc(50% + 38px)" }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-mono text-xs text-[--accent] tracking-widest">→ converting</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom label row */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[--border-strong]" />
          <AnimatePresence mode="wait">
            <motion.span
              key={hovered ? "pdf-label" : "nb-label"}
              className="font-mono text-[11px] tracking-[0.15em] text-[--muted]"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {hovered ? "document.pdf" : "hover to transform"}
            </motion.span>
          </AnimatePresence>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[--border-strong]" />
        </motion.div>
      </div>
    </section>
  );
}
