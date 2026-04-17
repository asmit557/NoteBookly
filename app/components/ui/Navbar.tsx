"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "./Button";

export default function Navbar() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85]);
  const { data: session, status } = useSession();

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

        {/* Auth actions */}
        <div className="flex items-center gap-3 shrink-0">
          {status === "loading" && (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-[--surface]" />
          )}

          {status === "unauthenticated" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signIn("google")}
            >
              <GoogleIcon />
              Sign in
            </Button>
          )}

          {status === "authenticated" && session.user && (
            <>
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full ring-1 ring-[--border]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[--accent] text-xs font-medium text-white">
                    {session.user.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <span className="hidden sm:block text-sm text-[--muted-light] max-w-[120px] truncate">
                  {session.user.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
