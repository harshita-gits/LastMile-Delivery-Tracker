import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

// ---------------- Zones ----------------

const zoneSchema = z.object({ name: z.string().min(2), city: z.string().optional() });

export const createZone = asyncHandler(async (req: Request, res: Response) => {
  const data = zoneSchema.parse(req.body);
  const zone = await prisma.zone.create({ data });
  res.status(201).json({ zone });
});

export const listZones = asyncHandler(async (_req: Request, res: Response) => {
  const zones = await prisma.zone.findMany({
    include: { areas: true, _count: { select: { agents: true } } },
    orderBy: { name: "asc" },
  });
  res.json({ zones });
});

// ---------------- Zone Areas (pincode -> zone mapping = zone detection input) ----------------

const zoneAreaSchema = z.object({
  zoneId: z.string().uuid(),
  pincode: z.string().min(3),
  areaName: z.string().optional(),
});

export const addZoneArea = asyncHandler(async (req: Request, res: Response) => {
  const data = zoneAreaSchema.parse(req.body);
  const zoneArea = await prisma.zoneArea.create({ data });
  res.status(201).json({ zoneArea });
});

export const bulkAddZoneAreas = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ items: z.array(zoneAreaSchema).min(1) });
  const { items } = schema.parse(req.body);
  const result = await prisma.zoneArea.createMany({ data: items, skipDuplicates: true });
  res.status(201).json({ created: result.count });
});

// ---------------- Rate Cards ----------------

const rateCardSchema = z.object({
  fromZoneId: z.string().uuid(),
  toZoneId: z.string().uuid(),
  orderType: z.enum(["B2B", "B2C"]),
  baseRatePerKg: z.number().positive(),
  minCharge: z.number().nonnegative(),
});

export const upsertRateCard = asyncHandler(async (req: Request, res: Response) => {
  const data = rateCardSchema.parse(req.body);
  const rateCard = await prisma.rateCard.upsert({
    where: {
      fromZoneId_toZoneId_orderType: {
        fromZoneId: data.fromZoneId,
        toZoneId: data.toZoneId,
        orderType: data.orderType,
      },
    },
    update: { baseRatePerKg: data.baseRatePerKg, minCharge: data.minCharge },
    create: data,
  });
  res.status(201).json({ rateCard });
});

export const listRateCards = asyncHandler(async (_req: Request, res: Response) => {
  const rateCards = await prisma.rateCard.findMany({
    include: { fromZone: true, toZone: true },
    orderBy: [{ orderType: "asc" }],
  });
  res.json({ rateCards });
});

// ---------------- COD Surcharge Config ----------------

const codConfigSchema = z.object({
  orderType: z.enum(["B2B", "B2C"]),
  flatFee: z.number().nonnegative(),
  percentOfCharge: z.number().min(0).max(100),
});

export const upsertCodConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = codConfigSchema.parse(req.body);
  const config = await prisma.codSurchargeConfig.upsert({
    where: { orderType: data.orderType },
    update: { flatFee: data.flatFee, percentOfCharge: data.percentOfCharge },
    create: data,
  });
  res.status(201).json({ config });
});

export const listCodConfigs = asyncHandler(async (_req: Request, res: Response) => {
  const configs = await prisma.codSurchargeConfig.findMany();
  res.json({ configs });
});

// ---------------- Agent account management ----------------

const createAgentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  currentZoneId: z.string().uuid().optional(),
});

export const createAgent = asyncHandler(async (req: Request, res: Response) => {
  const data = createAgentSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 10);

  const agent = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: "AGENT",
      },
    });
    return tx.agent.create({
      data: { userId: user.id, currentZoneId: data.currentZoneId },
      include: { user: true },
    });
  });

  res.status(201).json({ agent });
});

export const listAgents = asyncHandler(async (_req: Request, res: Response) => {
  const agents = await prisma.agent.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      currentZone: true,
      _count: { select: { orders: true } },
    },
  });
  res.json({ agents });
});

const updateAgentSchema = z.object({
  currentZoneId: z.string().uuid().optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
});

export const updateAgent = asyncHandler(async (req: Request, res: Response) => {
  const data = updateAgentSchema.parse(req.body);
  const agent = await prisma.agent.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ agent });
});

// ---------------- Customer list (for admin "create order on behalf of") ----------------

export const listCustomers = asyncHandler(async (_req: Request, res: Response) => {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true, phone: true },
  });
  res.json({ customers });
});
