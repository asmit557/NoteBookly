"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Button from "./Button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Docs", href: "#" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 h-16"
      style={{
        borderBottomColor: borderOpacity.get() > 0
          ? `rgba(255,255,255,${borderOpacity.get() * 0.07})`
          : "transparent",
      }}
    >
      {/* Blur + bg layer */}
      <motion.div
        className="absolute inset-0 backdrop-blur-md"
        style={{ opacity: bgOpacity, backgroundColor: "rgba(8,8,16,0.85)" }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-[--border]"
        style={{ opacity: borderOpacity }}
      />

      <nav className="container relative flex h-full items-center justify-between gap-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[--accent] shadow-[0_0_14px_rgba(108,99,255,0.5)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 11 7 3l5 8H2Z" fill="white" fillOpacity="0.9" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight text-[--foreground] group-hover:text-white transition-colors">
            LOGO
          </span>
        </a>

        {/* Links */}
        {/* <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="px-3 py-1.5 text-sm text-[--muted] rounded-md hover:text-[--foreground] hover:bg-[--surface] transition-all duration-150"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul> */}

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button variant="ghost" size="sm">
            Get started
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}
