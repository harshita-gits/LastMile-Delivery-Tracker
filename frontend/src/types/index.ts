export type Role = "CUSTOMER" | "AGENT" | "ADMIN";
export type OrderType = "B2B" | "B2C";
export type PaymentType = "PREPAID" | "COD";
export type OrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RESCHEDULED";
export type AgentAvailability = "AVAILABLE" | "BUSY" | "OFFLINE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Zone {
  id: string;
  name: string;
  city?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  pickupAddress: string;
  pickupPincode: string;
  dropAddress: string;
  dropPincode: string;
  pickupZone?: Zone;
  dropZone?: Zone;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  actualWeightKg: string;
  volumetricWeightKg: string;
  billableWeightKg: string;
  orderType: OrderType;
  paymentType: PaymentType;
  baseCharge: string;
  codSurcharge: string;
  totalCharge: string;
  status: OrderStatus;
  failureReason?: string;
  rescheduledDate?: string;
  createdAt: string;
  customer?: { name: string; email: string; phone?: string };
  assignedAgent?: { id: string; user: { name: string; phone?: string } };
  statusHistory?: {
    id: string;
    status: OrderStatus;
    note?: string;
    actorRole?: Role;
    createdAt: string;
  }[];
}

export interface ChargeBreakdown {
  pickupZoneId: string;
  dropZoneId: string;
  volumetricWeightKg: number;
  billableWeightKg: number;
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
}
