import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import codelabRouter from "./codelab/routes/codelab.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));

// Health check — used by frontend and deploy platform to confirm the server is up
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notebookly-backend" });
});

// ── Feature routers ───────────────────────────────────────────────────────────
app.use("/api/codelab", codelabRouter);

app.listen(PORT, () => {
  console.log(`[backend] running on http://localhost:${PORT}`);
  console.log(`[backend] accepting requests from ${FRONTEND_URL}`);
});
