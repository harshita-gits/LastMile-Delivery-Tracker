import { OrderType, PaymentType } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";

const VOLUMETRIC_DIVISOR = 5000; // industry-standard divisor, cm^3 -> kg

export interface DimensionsInput {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
}

export interface ChargeBreakdown {
  pickupZoneId: string;
  dropZoneId: string;
  volumetricWeightKg: number;
  billableWeightKg: number;
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
  rateCardId: string;
}

/**
 * Detects the Zone for a given pincode by looking up the ZoneArea mapping
 * that admins configure. Throws a clear error if the pincode is unmapped —
 * this is intentional: silently defaulting to a zone would corrupt billing.
 */
export async function detectZoneForPincode(pincode: string): Promise<string> {
  const zoneArea = await prisma.zoneArea.findUnique({ where: { pincode } });
  if (!zoneArea) {
    throw new ApiError(
      422,
      `Pincode "${pincode}" is not mapped to any zone. Ask an admin to add it under zone management.`
    );
  }
  return zoneArea.zoneId;
}

/** Volumetric weight (kg) = (L x B x H in cm) / 5000 */
export function calculateVolumetricWeight(dims: {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}): number {
  const raw = (dims.lengthCm * dims.breadthCm * dims.heightCm) / VOLUMETRIC_DIVISOR;
  return round2(raw);
}

/** Billable weight = max(actual, volumetric) */
export function calculateBillableWeight(actualKg: number, volumetricKg: number): number {
  return round2(Math.max(actualKg, volumetricKg));
}

/**
 * Full charge calculation pipeline. This is the single source of truth used
 * both at order-creation time (to persist the charge) and to show the
 * "estimated charge" preview to the customer before they confirm.
 */
export async function calculateOrderCharge(params: {
  pickupPincode: string;
  dropPincode: string;
  dims: DimensionsInput;
  orderType: OrderType;
  paymentType: PaymentType;
}): Promise<ChargeBreakdown> {
  const { pickupPincode, dropPincode, dims, orderType, paymentType } = params;

  // 1. Zone detection
  const pickupZoneId = await detectZoneForPincode(pickupPincode);
  const dropZoneId = await detectZoneForPincode(dropPincode);

  // 2. Volumetric weight & billable weight
  const volumetricWeightKg = calculateVolumetricWeight(dims);
  const billableWeightKg = calculateBillableWeight(dims.actualWeightKg, volumetricWeightKg);

  // 3. Rate card lookup — exact match on (fromZone, toZone, orderType).
  // Intra-zone rates are just rows where fromZoneId === toZoneId, configured
  // by admins like any other rate — no special-casing needed here.
  const rateCard = await prisma.rateCard.findUnique({
    where: {
      fromZoneId_toZoneId_orderType: {
        fromZoneId: pickupZoneId,
        toZoneId: dropZoneId,
        orderType,
      },
    },
  });

  if (!rateCard) {
    throw new ApiError(
      422,
      `No rate card configured for this route (${orderType}). Ask an admin to configure it.`
    );
  }

  const baseRatePerKg = Number(rateCard.baseRatePerKg);
  const minCharge = Number(rateCard.minCharge);
  const baseChargeRaw = billableWeightKg * baseRatePerKg;
  const baseCharge = round2(Math.max(baseChargeRaw, minCharge));

  // 4. COD surcharge (flat fee + percentage of base charge), only if COD.
  let codSurcharge = 0;
  if (paymentType === "COD") {
    const codConfig = await prisma.codSurchargeConfig.findUnique({
      where: { orderType },
    });
    if (codConfig) {
      const flat = Number(codConfig.flatFee);
      const percent = Number(codConfig.percentOfCharge);
      codSurcharge = round2(flat + (baseCharge * percent) / 100);
    }
  }

  const totalCharge = round2(baseCharge + codSurcharge);

  return {
    pickupZoneId,
    dropZoneId,
    volumetricWeightKg,
    billableWeightKg,
    baseCharge,
    codSurcharge,
    totalCharge,
    rateCardId: rateCard.id,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
