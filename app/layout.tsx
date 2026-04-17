import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/ui/Navbar";
import SessionProvider from "./components/providers/SessionProvider";
import ThemeProvider from "./components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "nbpdf — Turn Notebooks into Beautiful PDFs",
  description:
    "Upload any Jupyter notebook and get a clean, styled PDF in seconds. No setup, no CLI, no friction.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="relative min-h-full antialiased">
        {/* Ambient blobs — fixed, behind everything */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-[20%] left-[5%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.07)_0%,transparent_65%)] blur-3xl" />
          <div className="absolute top-[50%] -right-[5%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.05)_0%,transparent_65%)] blur-3xl" />
          <div className="absolute -bottom-[10%] left-[25%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.04)_0%,transparent_65%)] blur-3xl" />
        </div>

        <SessionProvider>
          <ThemeProvider>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
