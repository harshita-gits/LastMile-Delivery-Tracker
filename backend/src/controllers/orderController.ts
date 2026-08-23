import { Request, Response } from "express";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { calculateOrderCharge } from "../services/rateEngine";
import { createOrder, transitionOrderStatus, rescheduleOrder } from "../services/orderService";
import { autoAssignAgent, manualAssignAgent } from "../services/assignmentService";

const dimsSchema = z.object({
  lengthCm: z.number().positive(),
  breadthCm: z.number().positive(),
  heightCm: z.number().positive(),
  actualWeightKg: z.number().positive(),
});

const orderInputSchema = z.object({
  pickupAddress: z.string().min(3),
  pickupPincode: z.string().min(3),
  dropAddress: z.string().min(3),
  dropPincode: z.string().min(3),
  dims: dimsSchema,
  orderType: z.enum(["B2B", "B2C"]),
  paymentType: z.enum(["PREPAID", "COD"]),
  // Only used by admin creating on behalf of a customer:
  customerId: z.string().uuid().optional(),
});

/** POST /orders/preview — shows charge BEFORE the customer confirms, per spec. */
export const previewCharge = asyncHandler(async (req: Request, res: Response) => {
  const data = orderInputSchema.omit({ customerId: true }).parse(req.body);
  const charge = await calculateOrderCharge({
    pickupPincode: data.pickupPincode,
    dropPincode: data.dropPincode,
    dims: data.dims,
    orderType: data.orderType,
    paymentType: data.paymentType,
  });
  res.json({ charge });
});

/** POST /orders — customer places an order, or admin places on behalf of a customer. */
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = orderInputSchema.parse(req.body);
  const requester = req.user!;

  let customerId: string;
  let createdByAdminId: string | undefined;

  if (requester.role === "ADMIN") {
    if (!data.customerId) {
      throw new ApiError(400, "customerId is required when admin creates an order");
    }
    customerId = data.customerId;
    createdByAdminId = requester.userId;
  } else if (requester.role === "CUSTOMER") {
    customerId = requester.userId;
  } else {
    throw new ApiError(403, "Only customers or admins can place orders");
  }

  const order = await createOrder({
    customerId,
    createdByAdminId,
    pickupAddress: data.pickupAddress,
    pickupPincode: data.pickupPincode,
    dropAddress: data.dropAddress,
    dropPincode: data.dropPincode,
    dims: data.dims,
    orderType: data.orderType,
    paymentType: data.paymentType,
  });

  res.status(201).json({ order });
});

/** GET /orders/:id — full order + tracking timeline. Enforces ownership for customers. */
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      statusHistory: { orderBy: { createdAt: "asc" } },
      pickupZone: true,
      dropZone: true,
      assignedAgent: { include: { user: { select: { name: true, phone: true } } } },
      customer: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!order) throw new ApiError(404, "Order not found");

  const requester = req.user!;
  if (requester.role === "CUSTOMER" && order.customerId !== requester.userId) {
    throw new ApiError(403, "You do not have access to this order");
  }
  if (
    requester.role === "AGENT" &&
    order.assignedAgent?.userId !== requester.userId
  ) {
    throw new ApiError(403, "You do not have access to this order");
  }

  res.json({ order });
});

/** GET /orders — customer: own orders. agent: assigned orders. admin: all, with filters. */
export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const requester = req.user!;
  const { status, zoneId, agentId } = req.query as Record<string, string | undefined>;

  const where: any = {};
  if (status) where.status = status as OrderStatus;
  if (zoneId) where.pickupZoneId = zoneId;

  if (requester.role === "CUSTOMER") {
    where.customerId = requester.userId;
  } else if (requester.role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId: requester.userId } });
    if (!agent) throw new ApiError(404, "Agent profile not found");
    where.assignedAgentId = agent.id;
  } else if (requester.role === "ADMIN" && agentId) {
    where.assignedAgentId = agentId;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      pickupZone: true,
      dropZone: true,
      assignedAgent: { include: { user: { select: { name: true } } } },
      customer: { select: { name: true, email: true } },
    },
  });

  res.json({ orders });
});

/** POST /orders/:id/assign — admin manual assign, or trigger auto-assign. */
export const assignOrder = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ agentId: z.string().uuid().optional(), auto: z.boolean().optional() });
  const { agentId, auto } = schema.parse(req.body);

  if (auto) {
    const assignedAgentId = await autoAssignAgent(req.params.id);
    return res.json({ assignedAgentId, mode: "auto" });
  }
  if (!agentId) throw new ApiError(400, "Provide agentId, or set auto: true");
  await manualAssignAgent(req.params.id, agentId);
  res.json({ assignedAgentId: agentId, mode: "manual" });
});

/** PATCH /orders/:id/status — agent updates status along the lifecycle. */
const statusUpdateSchema = z.object({
  status: z.enum([
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
  ]),
  note: z.string().optional(),
  failureReason: z.string().optional(),
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = statusUpdateSchema.parse(req.body);
  const requester = req.user!;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { assignedAgent: true },
  });
  if (!order) throw new ApiError(404, "Order not found");

  if (requester.role === "AGENT" && order.assignedAgent?.userId !== requester.userId) {
    throw new ApiError(403, "This order is not assigned to you");
  }

  if (data.status === "FAILED" && data.failureReason) {
    await prisma.order.update({
      where: { id: order.id },
      data: { failureReason: data.failureReason },
    });
  }

  const updated = await transitionOrderStatus({
    orderId: order.id,
    newStatus: data.status as OrderStatus,
    actorId: requester.userId,
    actorRole: requester.role,
    note: data.note,
  });

  res.json({ order: updated });
});

/** PATCH /orders/:id/override — admin can force any status. */
const overrideSchema = z.object({
  status: z.enum([
    "CREATED",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "RESCHEDULED",
  ]),
  note: z.string().optional(),
});

export const overrideOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = overrideSchema.parse(req.body);
  const requester = req.user!;

  const updated = await transitionOrderStatus({
    orderId: req.params.id,
    newStatus: data.status as OrderStatus,
    actorId: requester.userId,
    actorRole: requester.role,
    note: data.note,
    isAdminOverride: true,
  });

  res.json({ order: updated });
});

/** POST /orders/:id/reschedule — customer reschedules a FAILED delivery. */
const rescheduleSchema = z.object({ newDate: z.string().datetime() });

export const reschedule = asyncHandler(async (req: Request, res: Response) => {
  const data = rescheduleSchema.parse(req.body);
  const requester = req.user!;

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new ApiError(404, "Order not found");
  if (requester.role === "CUSTOMER" && order.customerId !== requester.userId) {
    throw new ApiError(403, "You do not have access to this order");
  }

  const updated = await rescheduleOrder({
    orderId: req.params.id,
    newDate: new Date(data.newDate),
    actorId: requester.userId,
  });

  res.json({ order: updated });
});
