import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// Vercel: run as Node.js (not Edge), allow up to 60 s for Chromium
export const runtime = "nodejs";
export const maxDuration = 60;

// ── Markdown + syntax highlighting setup ──────────────────────────────────────

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

// Inline highlight.js github theme so Puppeteer doesn't need network access
// Use process.cwd() — safe in both CJS and ESM Next.js contexts
const HLJS_CSS = fs.readFileSync(
  path.join(process.cwd(), "node_modules/highlight.js/styles/github.min.css"),
  "utf8"
);

// ── Chromium resolution ───────────────────────────────────────────────────────
// @sparticuz/chromium ships a Linux binary for Lambda/Vercel.
// In local development we fall back to a locally installed Chrome/Chromium.

const LOCAL_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Chromium\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

async function getBrowserOptions() {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const localExec = LOCAL_CHROME_PATHS.find((p) => fs.existsSync(p));
    if (!localExec) {
      throw new Error(
        "Local Chrome not found. Install Google Chrome or set CHROME_EXECUTABLE_PATH."
      );
    }
    return {
      executablePath: process.env.CHROME_EXECUTABLE_PATH ?? localExec,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true as const,
    };
  }

  // Production (Vercel / Lambda)
  return {
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: true as const,
  };
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Notebook types ────────────────────────────────────────────────────────────

interface NotebookOutput {
  output_type: string;
  text?: string | string[];
  data?: Record<string, string | string[]>;
  traceback?: string[];
}

interface NotebookCell {
  cell_type: "markdown" | "code" | "raw";
  source: string | string[];
  outputs?: NotebookOutput[];
}

interface Notebook {
  cells: NotebookCell[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function joinSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join("") : source;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderOutput(output: NotebookOutput): string {
  if (output.output_type === "stream") {
    return `<pre class="output stream">${escapeHtml(joinSource(output.text ?? ""))}</pre>`;
  }

  if (
    output.output_type === "display_data" ||
    output.output_type === "execute_result"
  ) {
    const data = output.data ?? {};
    if (data["text/plain"]) {
      return `<pre class="output">${escapeHtml(joinSource(data["text/plain"]))}</pre>`;
    }
    if (data["text/html"]) {
      return `<div class="output html-output">${joinSource(data["text/html"])}</div>`;
    }
  }

  if (output.output_type === "error") {
    // Strip ANSI escape codes from tracebacks
    const raw = (output.traceback ?? [])
      .join("\n")
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[[0-9;]*m/g, "");
    return `<pre class="output error">${escapeHtml(raw)}</pre>`;
  }

  return "";
}

function generateHTML(notebook: Notebook): string {
  const parts: string[] = [];

  for (const cell of notebook.cells) {
    const source = joinSource(cell.source);

    if (cell.cell_type === "markdown") {
      const html = marked.parse(source) as string;
      parts.push(`<div class="cell markdown">${html}</div>`);
    } else if (cell.cell_type === "code") {
      // highlighted via marked/hljs renderer — wrap in a styled container
      const highlighted = hljs.highlightAuto(source).value;
      parts.push(
        `<div class="cell code"><pre><code class="hljs">${highlighted}</code></pre>` +
          (cell.outputs ?? []).map(renderOutput).join("") +
          `</div>`
      );
    } else if (cell.cell_type === "raw") {
      parts.push(`<div class="cell raw"><pre>${escapeHtml(source)}</pre></div>`);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
/* ── highlight.js theme ── */
${HLJS_CSS}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Base ── */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.75;
  color: #0f172a;
  background: #ffffff;
  padding: 48px 56px;
  max-width: 860px;
}

/* ── Headings ── */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}
h1 { font-size: 32px; margin: 40px 0 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
h2 { font-size: 24px; margin: 32px 0 10px; }
h3 { font-size: 20px; margin: 24px 0 8px; }
h4 { font-size: 17px; margin: 20px 0 6px; }

/* ── Body text ── */
p { margin: 12px 0; }

strong { font-weight: 600; }
em     { font-style: italic; }

a { color: #6366f1; text-decoration: underline; }

/* ── Lists ── */
ul, ol { padding-left: 24px; margin: 12px 0; }
li     { margin: 5px 0; }
li > ul, li > ol { margin: 4px 0; }

/* ── Inline code ── */
:not(pre) > code {
  font-family: "SFMono-Regular", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 6px;
  color: #7c3aed;
}

/* ── Code blocks (code cells + fenced markdown blocks) ── */
pre {
  background: #0f172a;
  border-radius: 10px;
  padding: 18px 20px;
  overflow-x: auto;
  margin: 8px 0;
}
pre code {
  font-family: "SFMono-Regular", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.65;
  color: #e2e8f0;
  background: transparent;
  border: none;
  padding: 0;
}

/* ── Blockquotes ── */
blockquote {
  border-left: 4px solid #6366f1;
  margin: 16px 0;
  padding: 8px 16px;
  background: #f8f9ff;
  border-radius: 0 6px 6px 0;
  color: #475569;
  font-style: italic;
}
blockquote p { margin: 4px 0; }

/* ── Tables ── */
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
th, td { padding: 10px 14px; border: 1px solid #e2e8f0; text-align: left; }
th { background: #f8fafc; font-weight: 600; }
tr:nth-child(even) td { background: #f8fafc; }

/* ── Horizontal rule ── */
hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }

/* ── Cell containers ── */
.cell { margin-bottom: 20px; }
.cell.markdown { }
.cell.code { }
.cell.raw pre {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
}

/* ── Cell outputs ── */
.output {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #94a3b8;
  border-radius: 0 6px 6px 0;
  padding: 10px 14px;
  margin-top: 6px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  color: #334155;
}
.output.stream { border-left-color: #60a5fa; background: #eff6ff; }
.output.error  {
  border-left-color: #f87171;
  background: #fef2f2;
  color: #b91c1c;
}
.html-output { padding: 8px 0; font-size: 14px; }
</style>
</head>
<body>
${parts.join("\n")}
</body>
</html>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }
    if (!file.name.endsWith(".ipynb")) {
      return NextResponse.json(
        { message: "Only .ipynb files are accepted." },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ message: "File is empty." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "File exceeds the 5 MB limit." },
        { status: 400 }
      );
    }

    // Parse notebook in memory — no disk I/O
    const text = await file.text();
    let notebook: Notebook;
    try {
      notebook = JSON.parse(text) as Notebook;
    } catch {
      return NextResponse.json(
        { message: "Invalid .ipynb file (JSON parse failed)." },
        { status: 400 }
      );
    }
    if (!Array.isArray(notebook.cells)) {
      return NextResponse.json(
        { message: "Invalid notebook: missing cells array." },
        { status: 400 }
      );
    }

    const html = generateHTML(notebook);

    browser = await puppeteer.launch(await getBrowserOptions());
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfUint8 = await page.pdf({
      format: "A4",
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
      printBackground: true,
    });

    const pdf = Buffer.from(pdfUint8);
    const downloadName = file.name.replace(/\.ipynb$/, ".pdf");

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(pdf.byteLength),
      },
    });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);

    let message = "Conversion failed.";
    if (raw.includes("timeout")) {
      message = "Conversion timed out. Try a smaller notebook.";
    } else if (raw.includes("Local Chrome not found")) {
      message = "Chrome not found locally. Install Google Chrome to use this in development.";
    } else if (raw.includes("executablePath") || raw.includes("ENOENT")) {
      message = "Chromium executable not found. Check your environment setup.";
    }

    // Surface the raw cause in development so it's visible in the UI
    const detail = process.env.NODE_ENV === "development" ? ` (${raw})` : "";
    return NextResponse.json({ message: message + detail }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
