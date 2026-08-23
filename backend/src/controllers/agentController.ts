import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getMyAgentProfile = asyncHandler(async (req: Request, res: Response) => {
  const agent = await prisma.agent.findUnique({
    where: { userId: req.user!.userId },
    include: { currentZone: true, user: { select: { name: true, email: true, phone: true } } },
  });
  if (!agent) throw new ApiError(404, "Agent profile not found");
  res.json({ agent });
});

const updateSelfSchema = z.object({
  currentZoneId: z.string().uuid().optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
});

export const updateMyAgentProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSelfSchema.parse(req.body);
  const existing = await prisma.agent.findUnique({ where: { userId: req.user!.userId } });
  if (!existing) throw new ApiError(404, "Agent profile not found");

  const agent = await prisma.agent.update({
    where: { id: existing.id },
    data,
  });
  res.json({ agent });
});

/** GET /agents/my-orders — active + past deliveries for the logged-in agent. */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const agent = await prisma.agent.findUnique({ where: { userId: req.user!.userId } });
  if (!agent) throw new ApiError(404, "Agent profile not found");

  const orders = await prisma.order.findMany({
    where: { assignedAgentId: agent.id },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true, phone: true } }, pickupZone: true, dropZone: true },
  });
  res.json({ orders });
});
