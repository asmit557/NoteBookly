"use client";

import { useEffect } from "react";

export default function CodelabError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[codelab] page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 pt-20">
      <p className="text-sm font-semibold text-[--foreground]">Something went wrong</p>
      <pre className="text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-3 max-w-xl text-left whitespace-pre-wrap break-all">
        {error.message}
        {error.digest ? `\ndigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-xs bg-[--accent] text-white cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
