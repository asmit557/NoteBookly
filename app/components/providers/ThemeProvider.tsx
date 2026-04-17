"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type PdfTheme = "light" | "dark";

interface ThemeContextValue {
  pdfTheme: PdfTheme;
  togglePdfTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  pdfTheme: "light",
  togglePdfTheme: () => {},
});

export function usePdfTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "nbpdf-theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setPdfTheme(stored);
    }
  }, []);

  const togglePdfTheme = useCallback(() => {
    setPdfTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ pdfTheme, togglePdfTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
