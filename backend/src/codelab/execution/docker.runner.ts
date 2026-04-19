import { spawn } from "child_process";
import path from "path";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

const TIMEOUT_MS = 5_000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

// In the Docker build the runner is placed one level above dist/ (at /workspace/runner.py).
// Locally it lives at backend/docker/runner.py, two levels above src/.
const RUNNER_SCRIPT =
  process.env.RUNNER_SCRIPT_PATH ??
  path.resolve(__dirname, "../../..", "runner.py");

export async function runPython(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const child = spawn("python3", ["-Bu", RUNNER_SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdin.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code !== "EPIPE") {
        console.error("[runner] stdin write error:", err.message);
      }
    });

    child.stdin.write(code, "utf8");
    child.stdin.end();

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk.toString("utf8");
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TIMEOUT_MS + 1_000);

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
        stderr: `Failed to start Python runner: ${err.message}`,
        exitCode: -1,
        timedOut: false,
      });
    });
  });
}
