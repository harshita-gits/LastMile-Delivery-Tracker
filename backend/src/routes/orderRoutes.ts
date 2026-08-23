import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import {
  previewCharge,
  placeOrder,
  getOrder,
  listOrders,
  assignOrder,
  updateOrderStatus,
  overrideOrderStatus,
  reschedule,
} from "../controllers/orderController";

const router = Router();

router.use(authenticate);

router.post("/preview", previewCharge); // any authenticated role can preview
router.post("/", requireRole("CUSTOMER", "ADMIN"), placeOrder);
router.get("/", listOrders); // scoped per-role inside controller
router.get("/:id", getOrder);

router.post("/:id/assign", requireRole("ADMIN"), assignOrder);
router.patch("/:id/status", requireRole("AGENT"), updateOrderStatus);
router.patch("/:id/override", requireRole("ADMIN"), overrideOrderStatus);
router.post("/:id/reschedule", requireRole("CUSTOMER"), reschedule);

export default router;
