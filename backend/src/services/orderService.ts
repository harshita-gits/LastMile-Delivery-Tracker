import { OrderStatus, OrderType, PaymentType, Role } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { calculateOrderCharge, DimensionsInput } from "./rateEngine";
import { autoAssignAgent, releaseAgentIfIdle } from "./assignmentService";
import { sendStatusEmail, sendStatusSms } from "./notificationService";

// Legal status transitions. Enforced server-side so the lifecycle can never
// be corrupted via a stray API call, regardless of what the UI allows.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["ASSIGNED", "FAILED"],
  ASSIGNED: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["RESCHEDULED"],
  RESCHEDULED: ["ASSIGNED"],
};

export interface CreateOrderInput {
  customerId: string;
  createdByAdminId?: string;
  pickupAddress: string;
  pickupPincode: string;
  dropAddress: string;
  dropPincode: string;
  dims: DimensionsInput;
  orderType: OrderType;
  paymentType: PaymentType;
}

async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  const seq = (count + 1).toString().padStart(6, "0");
  return `LMD-${seq}`;
}

/**
 * Creates an order with the charge computed and persisted (never
 * recomputed silently later), then logs the initial CREATED entry in the
 * immutable status history.
 */
export async function createOrder(input: CreateOrderInput) {
  const charge = await calculateOrderCharge({
    pickupPincode: input.pickupPincode,
    dropPincode: input.dropPincode,
    dims: input.dims,
    orderType: input.orderType,
    paymentType: input.paymentType,
  });

  const orderNumber = await generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: input.customerId,
        createdByAdminId: input.createdByAdminId,
        pickupAddress: input.pickupAddress,
        pickupPincode: input.pickupPincode,
        dropAddress: input.dropAddress,
        dropPincode: input.dropPincode,
        pickupZoneId: charge.pickupZoneId,
        dropZoneId: charge.dropZoneId,
        lengthCm: input.dims.lengthCm,
        breadthCm: input.dims.breadthCm,
        heightCm: input.dims.heightCm,
        actualWeightKg: input.dims.actualWeightKg,
        volumetricWeightKg: charge.volumetricWeightKg,
        billableWeightKg: charge.billableWeightKg,
        orderType: input.orderType,
        paymentType: input.paymentType,
        baseCharge: charge.baseCharge,
        codSurcharge: charge.codSurcharge,
        totalCharge: charge.totalCharge,
        status: "CREATED",
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: created.id,
        status: "CREATED",
        actorId: input.createdByAdminId ?? input.customerId,
        actorRole: input.createdByAdminId ? "ADMIN" : "CUSTOMER",
        note: "Order created",
      },
    });

    return created;
  });

  return order;
}

/**
 * Validated status transition + immutable history log + agent release on
 * terminal states + email/SMS notification. This is the single choke point
 * every status change (agent update, admin override) must go through.
 */
export async function transitionOrderStatus(params: {
  orderId: string;
  newStatus: OrderStatus;
  actorId: string;
  actorRole: Role;
  note?: string;
  isAdminOverride?: boolean;
}) {
  const { orderId, newStatus, actorId, actorRole, note, isAdminOverride } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order) throw new ApiError(404, "Order not found");

  // Admin override bypasses the state machine (per spec: "override any order status").
  // Every other actor must follow ALLOWED_TRANSITIONS.
  if (!isAdminOverride) {
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        409,
        `Invalid status transition: ${order.status} -> ${newStatus}`
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        actorId,
        actorRole,
        note: isAdminOverride ? `[ADMIN OVERRIDE] ${note ?? ""}`.trim() : note,
      },
    });
    return u;
  });

  // Free up the agent once the order reaches a terminal state.
  if (order.assignedAgentId && (newStatus === "DELIVERED" || newStatus === "FAILED")) {
    await releaseAgentIfIdle(order.assignedAgentId);
  }

  // Fire-and-forget notifications — never block/fail the status transition on them.
  sendStatusEmail({
    to: order.customer.email,
    orderNumber: order.orderNumber,
    status: newStatus,
  }).catch(() => {});
  if (order.customer.phone) {
    sendStatusSms({
      to: order.customer.phone,
      orderNumber: order.orderNumber,
      status: newStatus,
    }).catch(() => {});
  }

  return updated;
}

/**
 * Failed delivery -> reschedule flow. Customer picks a new date, order
 * moves to RESCHEDULED, then re-enters the assignment pool.
 */
export async function rescheduleOrder(params: {
  orderId: string;
  newDate: Date;
  actorId: string;
}) {
  const { orderId, newDate, actorId } = params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "FAILED") {
    throw new ApiError(409, "Only orders with status FAILED can be rescheduled");
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "RESCHEDULED",
        rescheduledDate: newDate,
        assignedAgentId: null, // will be re-assigned fresh
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "RESCHEDULED",
        actorId,
        actorRole: "CUSTOMER",
        note: `Rescheduled to ${newDate.toISOString()}`,
      },
    });
  });

  // Re-run auto-assignment for the rescheduled attempt.
  try {
    await autoAssignAgent(orderId);
  } catch (err) {
    // No agent available right now — leave in RESCHEDULED, admin can assign manually later.
    console.warn(`Auto-assignment on reschedule failed for ${orderId}:`, (err as Error).message);
  }

  return prisma.order.findUnique({ where: { id: orderId } });
}
