"use client";

import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 2L3 7v6l7 5 7-5V7l-7-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 2v16M3 7l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Fast Conversion",
    description:
      "Notebooks converted in under 3 seconds. No queues, no waiting — just instant, server-side rendering at scale.",
    stat: "< 3s",
    statLabel: "avg. render time",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Clean PDF Output",
    description:
      "Syntax-highlighted code, rendered plots, and crisp LaTeX math — every element formatted precisely.",
    stat: "100%",
    statLabel: "element fidelity",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 2a4 4 0 0 1 4 4v2H6V6a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="13" r="1.5" fill="currentColor" />
      </svg>
    ),
    title: "Secure Upload",
    description:
      "Files are encrypted in transit, processed in an isolated sandbox, and permanently deleted after download.",
    stat: "AES-256",
    statLabel: "encryption",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M6 7l-3 3 3 3M14 7l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.5 5l-3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Developer Friendly",
    description:
      "REST API, CLI tool, and GitHub Action — integrate notebook-to-PDF into any pipeline in minutes.",
    stat: "REST + CLI",
    statLabel: "integration options",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.08,
    },
  }),
};

const headingVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Heading */}
        <motion.div
          className="mx-auto max-w-3xl text-center mb-16 sm:mb-20"
          variants={headingVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[--accent] mb-3">
            Why teams choose us
          </p>

          <h2 className="gradient-text text-[clamp(1.75rem,3vw,2.75rem)] font-semibold tracking-[-0.03em] leading-tight mb-4">
            Everything you need,<br />nothing you don't
          </h2>
        </motion.div>

        {/* GRID (FIXED) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto place-items-center">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="w-full flex justify-center"
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ── Card ──────────────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
  stat,
  statLabel,
}: (typeof features)[0]) {
  return (
    <motion.div
      className="group relative flex flex-col w-full max-w-[300px] gap-6 rounded-2xl border border-[--border] bg-[--surface] p-6 transition-all"
      whileHover="hovered"
      initial="idle"
    >
      {/* Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0"
        variants={{
          idle: { opacity: 0 },
          hovered: { opacity: 1 },
        }}
        transition={{ duration: 0.3 }}
        style={{
          background:
            "radial-gradient(400px circle at 50% 0%, rgba(108,99,255,0.08), transparent 70%)",
        }}
      />

      {/* Top border */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        variants={{
          idle: { opacity: 0, scaleX: 0.6 },
          hovered: { opacity: 1, scaleX: 1 },
        }}
        transition={{ duration: 0.35 }}
        style={{
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
        }}
      />

      {/* Icon */}
      <motion.div
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[--border] bg-[--surface-hover] text-[--accent]"
        variants={{
          idle: { scale: 1 },
          hovered: { scale: 1.08 },
        }}
      >
        {icon}
      </motion.div>

      {/* Content */}
      <div className="flex flex-col gap-3 flex-1 text-center items-center">
        <h3 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[--foreground]">
          {title}
        </h3>
        <p className="text-sm text-[--muted-light] leading-relaxed">
          {description}
        </p>
      </div>

      {/* Stat */}
      <div className="pt-4 border-t border-[--border] flex items-center justify-center gap-2">
        <span className="text-lg font-semibold gradient-accent">{stat}</span>
        <span className="text-xs text-[--muted]">{statLabel}</span>
      </div>
    </motion.div>
  );
}