import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { getMyAgentProfile, updateMyAgentProfile, getMyOrders } from "../controllers/agentController";

const router = Router();

router.use(authenticate, requireRole("AGENT"));

router.get("/me", getMyAgentProfile);
router.patch("/me", updateMyAgentProfile);
router.get("/my-orders", getMyOrders);

export default router;
