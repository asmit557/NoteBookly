import { spawn } from "child_process";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

const IMAGE = process.env.RUNNER_IMAGE ?? "notebookly-runner";
const TIMEOUT_MS = 5_000;
const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB per stream — prevents memory exhaustion

export async function runPython(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const args = [
      "run",
      "--rm",                          // auto-remove container when done
      "--network", "none",             // no outbound or inbound network
      "--memory", "128m",              // hard memory cap
      "--memory-swap", "128m",         // disable swap (swap = 0 when equal to memory)
      "--cpus", "0.5",                 // at most half a CPU core
      "--pids-limit", "50",            // prevent fork bombs
      "--read-only",                   // immutable filesystem
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=10m", // writable /tmp, no exec
      "--no-new-privileges",           // block privilege escalation
      "--cap-drop", "ALL",             // drop every Linux capability
      "--ulimit", "nofile=64:64",      // limit open file descriptors
      "-i",                            // keep stdin open so we can pipe code
      IMAGE,
    ];

    const child = spawn("docker", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    // ── Feed code into the container via stdin ────────────────────────────────
    child.stdin.on("error", (err: NodeJS.ErrnoException) => {
      // EPIPE is expected if the container exits before we finish writing
      if (err.code !== "EPIPE") {
        console.error("[dockerRunner] stdin write error:", err.message);
      }
    });

    child.stdin.write(code, "utf8");
    child.stdin.end();

    // ── Collect output (capped to avoid unbounded memory use) ─────────────────
    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString("utf8");
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString("utf8");
      }
    });

    // ── Node-side timeout — kills the container if Docker is slow to enforce ──
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TIMEOUT_MS + 1_000); // 1 s grace on top of in-container alarm

    // ── Resolve when process exits ────────────────────────────────────────────
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode,
        timedOut,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: `Failed to start Docker: ${err.message}`,
        exitCode: -1,
        timedOut: false,
      });
    });
  });
}
