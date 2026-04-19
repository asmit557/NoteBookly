"""
Sandboxed Python executor.

Reads source code from stdin, compiles and exec()s it, then exits.
Primary isolation is provided by Docker (no network, read-only fs,
non-root user, capped memory/CPU).  SIGALRM is a belt-and-suspenders
in-process timeout in case Docker's --stop-timeout fires too late.
"""

import signal
import sys
import traceback


# ── In-process timeout (backup — Docker kill is the primary guard) ────────────

def _on_alarm(signum, frame):          # noqa: ANN001
    raise TimeoutError("timed out")


signal.signal(signal.SIGALRM, _on_alarm)
signal.alarm(5)                        # 5-second in-process limit

# ── Read code from stdin ──────────────────────────────────────────────────────

try:
    source = sys.stdin.read()
except Exception as exc:
    print(f"failed to read stdin: {exc}", file=sys.stderr)
    sys.exit(1)

# ── Execute ───────────────────────────────────────────────────────────────────

try:
    bytecode = compile(source, "<stdin>", "exec")
    exec(bytecode, {"__name__": "__main__", "__builtins__": __builtins__})  # noqa: S102

except SystemExit as exc:
    signal.alarm(0)
    sys.exit(exc.code if exc.code is not None else 0)

except TimeoutError as exc:
    signal.alarm(0)
    print(str(exc), file=sys.stderr)
    sys.exit(124)               # 124 = conventional "timed out" exit code

except SyntaxError:
    signal.alarm(0)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

except Exception:               # noqa: BLE001
    signal.alarm(0)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

signal.alarm(0)
