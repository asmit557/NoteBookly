"use client";

import { motion, useInView } from "framer-motion";
import { useRef, Fragment } from "react";

const steps = [
  {
    number: "01",
    title: "Upload your notebook",
    description: "Drop any .ipynb file — Jupyter, Colab, or Quarto. No account needed.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M11 2v12M7 10l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "We convert it",
    description: "Our renderer executes your notebook, applies clean styling, and compiles the PDF server-side.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M4 11a7 7 0 0 1 13.33-3M18 11a7 7 0 0 1-13.33 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15.5 5.5 17.33 8l2.17-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 16.5 4.67 14l-2.17 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Download your PDF",
    description: "Get a beautifully formatted PDF with syntax highlighting, charts, and math — ready to share.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="4" y="2" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 8h6M8 11h6M8 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14 17l2 2 2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/* ── Animated connector line ───────────────────────────── */
function Connector({ inView }: { inView: boolean }) {
  return (
    <div className="hidden lg:flex flex-1 items-center px-4 relative top-[-1.5rem]">
      <div className="relative w-full h-px bg-[--border]">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[--accent] to-[rgba(108,99,255,0.2)]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: inView ? 1 : 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          style={{ originX: 0 }}
        />
        {/* Arrow head */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[--accent]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        />
      </div>
    </div>
  );
}

/* ── Step card ─────────────────────────────────────────── */
function StepCard({
  step,
  index,
  inView,
}: {
  step: (typeof steps)[0];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center text-center max-w-xs w-full"
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 28, filter: "blur(6px)" }
      }
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
    >
      {/* Number badge + icon row */}
      <div className="relative mb-6">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={inView ? { boxShadow: "0 0 0 8px rgba(108,99,255,0.06)" } : { boxShadow: "0 0 0 0px rgba(108,99,255,0)" }}
          transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
        />
        {/* Icon box */}
        <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl border border-[--border-strong] bg-[--surface] text-[--accent]">
          {step.icon}
          {/* Step number — top-right pip */}
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[--accent] text-[10px] font-bold text-white leading-none">
            {index + 1}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-[--accent] opacity-70">
          Step {step.number}
        </span>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-[--foreground]">
          {step.title}
        </h3>
        <p className="text-sm text-[--muted] leading-relaxed max-w-[220px] mx-auto">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Section ───────────────────────────────────────────── */
export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Subtle horizontal scan line */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px opacity-20"
        style={{
          background: "linear-gradient(90deg, transparent 0%, var(--border-strong) 20%, var(--border-strong) 80%, transparent 100%)",
        }}
      />

      <div className="container flex flex-col gap-6">
        {/* Heading */}
        <motion.div
          className="text-center mb-36 sm:mb-32 mx-auto"
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[--accent] mb-4">
            How it works
          </p>
          <h2 className="gradient-text text-[clamp(1.75rem,3vw,2.75rem)] font-semibold tracking-[-0.03em] leading-tight">
            Three steps.<br />One beautiful PDF.
          </h2>
        </motion.div>

        {/* Steps */}
        <div
          ref={ref}
          className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-0 mt-6"
        >
          {steps.map((step, i) => (
            <Fragment key={step.number}>
              <StepCard step={step} index={i} inView={inView} />
              {i < steps.length - 1 && <Connector inView={inView} />}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
