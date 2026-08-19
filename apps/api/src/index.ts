import "dotenv/config";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.use("/api/v1/health", healthRouter);

app.listen(port, () => {
  console.log(`MatchCorner API listening on http://localhost:${port}`);
});
