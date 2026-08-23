import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { OrderStatus } from "@prisma/client";

const ACTIVE_STATUSES: OrderStatus[] = [
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

/**
 * Auto-assignment strategy:
 *   1. Prefer agents whose `currentZoneId` matches the order's pickup zone
 *      (this models "nearest agent" without needing live GPS tracking,
 *      which is unreliable to build/demo in a one-day window).
 *   2. Among zone matches, pick the AVAILABLE agent with the fewest
 *      currently-active orders (simple load balancing).
 *   3. If no agent is available in the exact pickup zone, fall back to any
 *      AVAILABLE agent city-wide, again ranked by lowest active order count.
 *   4. If nobody is available at all, throw — the order stays in CREATED
 *      status and admin can retry / manually assign later.
 */
export async function autoAssignAgent(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.pickupZoneId) {
    throw new ApiError(422, "Order has no detected pickup zone; cannot auto-assign");
  }

  const candidate = await findBestAgent(order.pickupZoneId);
  if (!candidate) {
    throw new ApiError(
      409,
      "No available delivery agent found for this zone or city. Try manual assignment."
    );
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { assignedAgentId: candidate.id, status: "ASSIGNED" },
    }),
    prisma.agent.update({
      where: { id: candidate.id },
      data: { availability: "BUSY" },
    }),
  ]);

  return candidate.id;
}

async function findBestAgent(pickupZoneId: string) {
  // Step 1: same-zone available agents, ranked by active order load.
  const sameZoneAgents = await prisma.agent.findMany({
    where: { currentZoneId: pickupZoneId, availability: "AVAILABLE" },
    include: { orders: { where: { status: { in: ACTIVE_STATUSES } } } },
  });

  if (sameZoneAgents.length > 0) {
    return pickLeastLoaded(sameZoneAgents);
  }

  // Step 2: fall back to the pickup zone's city -> any available agent in
  // a zone belonging to the same city.
  const pickupZone = await prisma.zone.findUnique({ where: { id: pickupZoneId } });
  if (pickupZone?.city) {
    const cityAgents = await prisma.agent.findMany({
      where: {
        availability: "AVAILABLE",
        currentZone: { city: pickupZone.city },
      },
      include: { orders: { where: { status: { in: ACTIVE_STATUSES } } } },
    });
    if (cityAgents.length > 0) {
      return pickLeastLoaded(cityAgents);
    }
  }

  // Step 3: last resort, any available agent at all.
  const anyAgents = await prisma.agent.findMany({
    where: { availability: "AVAILABLE" },
    include: { orders: { where: { status: { in: ACTIVE_STATUSES } } } },
  });
  return pickLeastLoaded(anyAgents);
}

function pickLeastLoaded<T extends { id: string; orders: unknown[] }>(agents: T[]): T | null {
  if (agents.length === 0) return null;
  return agents.reduce((best, current) =>
    current.orders.length < best.orders.length ? current : best
  );
}

/** Manual assignment by admin — bypasses ranking logic, just validates availability. */
export async function manualAssignAgent(orderId: string, agentId: string): Promise<void> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new ApiError(404, "Agent not found");

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { assignedAgentId: agentId, status: "ASSIGNED" },
    }),
    prisma.agent.update({
      where: { id: agentId },
      data: { availability: "BUSY" },
    }),
  ]);
}

/** Called when an order reaches a terminal state (DELIVERED/FAILED) — frees the agent up. */
export async function releaseAgentIfIdle(agentId: string): Promise<void> {
  const activeCount = await prisma.order.count({
    where: { assignedAgentId: agentId, status: { in: ACTIVE_STATUSES } },
  });
  if (activeCount === 0) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { availability: "AVAILABLE" },
    });
  }
}
