import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", routes);

app.get("/", (_req, res) => {
  res.json({ message: "Last-Mile Delivery Tracker API is running", docs: "/api/health" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
