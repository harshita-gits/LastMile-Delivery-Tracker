import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import {
  createZone,
  listZones,
  addZoneArea,
  bulkAddZoneAreas,
  upsertRateCard,
  listRateCards,
  upsertCodConfig,
  listCodConfigs,
  createAgent,
  listAgents,
  updateAgent,
  listCustomers,
} from "../controllers/adminController";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.post("/zones", createZone);
router.get("/zones", listZones);

router.post("/zone-areas", addZoneArea);
router.post("/zone-areas/bulk", bulkAddZoneAreas);

router.post("/rate-cards", upsertRateCard);
router.get("/rate-cards", listRateCards);

router.post("/cod-config", upsertCodConfig);
router.get("/cod-config", listCodConfigs);

router.post("/agents", createAgent);
router.get("/agents", listAgents);
router.patch("/agents/:id", updateAgent);

router.get("/customers", listCustomers);

export default router;
