import express from "express";
import cors from "cors";
import { initializeSchema } from "./db/schema.js";
import sessionRoutes from "./routes/sessions.js";
import profileRoutes from "./routes/profile.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initializeSchema();

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "LeetCode AI Coach backend is running",
    timestamp: new Date().toISOString(),
  });
});

// All session routes live under /api/sessions
app.use("/api/sessions", sessionRoutes);

app.use("/api/profile", profileRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
