FROM python:3.10-slim

# Create a non-root user — code never runs as root
RUN useradd -m -u 1001 -s /bin/false runner

WORKDIR /app

COPY runner.py .

RUN chown runner:runner runner.py

USER runner

# -B  disables .pyc bytecode writes (keeps filesystem clean under --read-only)
# -u  forces unbuffered stdout/stderr so output is flushed immediately
ENTRYPOINT ["python", "-Bu", "runner.py"]
