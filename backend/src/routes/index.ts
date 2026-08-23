import { Router } from "express";
import authRoutes from "./authRoutes";
import orderRoutes from "./orderRoutes";
import adminRoutes from "./adminRoutes";
import agentRoutes from "./agentRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/agents", agentRoutes);

router.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

export default router;
