import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ---------------- Admin ----------------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lastmile.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Admin",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  // ---------------- Zones ----------------
  const zoneNorth = await prisma.zone.upsert({
    where: { name: "Bengaluru-North" },
    update: {},
    create: { name: "Bengaluru-North", city: "Bengaluru" },
  });
  const zoneSouth = await prisma.zone.upsert({
    where: { name: "Bengaluru-South" },
    update: {},
    create: { name: "Bengaluru-South", city: "Bengaluru" },
  });
  const zoneMumbai = await prisma.zone.upsert({
    where: { name: "Mumbai-Central" },
    update: {},
    create: { name: "Mumbai-Central", city: "Mumbai" },
  });

  // ---------------- Zone Areas (pincode -> zone) ----------------
  await prisma.zoneArea.createMany({
    data: [
      { zoneId: zoneNorth.id, pincode: "560064", areaName: "Hebbal" },
      { zoneId: zoneNorth.id, pincode: "560080", areaName: "RT Nagar" },
      { zoneId: zoneNorth.id, pincode: "560032", areaName: "Hennur" },
      { zoneId: zoneSouth.id, pincode: "560078", areaName: "Jayanagar" },
      { zoneId: zoneSouth.id, pincode: "560068", areaName: "BTM Layout" },
      { zoneId: zoneSouth.id, pincode: "560076", areaName: "JP Nagar" },
      { zoneId: zoneMumbai.id, pincode: "400001", areaName: "Fort" },
      { zoneId: zoneMumbai.id, pincode: "400051", areaName: "Bandra Kurla Complex" },
    ],
    skipDuplicates: true,
  });

  // ---------------- Rate Cards (intra + inter zone, B2B + B2C) ----------------
  const rateCardRows: {
    fromZoneId: string;
    toZoneId: string;
    orderType: "B2B" | "B2C";
    baseRatePerKg: number;
    minCharge: number;
  }[] = [
    // Intra-zone (fromZoneId === toZoneId)
    { fromZoneId: zoneNorth.id, toZoneId: zoneNorth.id, orderType: "B2C", baseRatePerKg: 20, minCharge: 40 },
    { fromZoneId: zoneNorth.id, toZoneId: zoneNorth.id, orderType: "B2B", baseRatePerKg: 15, minCharge: 60 },
    { fromZoneId: zoneSouth.id, toZoneId: zoneSouth.id, orderType: "B2C", baseRatePerKg: 20, minCharge: 40 },
    { fromZoneId: zoneSouth.id, toZoneId: zoneSouth.id, orderType: "B2B", baseRatePerKg: 15, minCharge: 60 },
    { fromZoneId: zoneMumbai.id, toZoneId: zoneMumbai.id, orderType: "B2C", baseRatePerKg: 22, minCharge: 45 },
    { fromZoneId: zoneMumbai.id, toZoneId: zoneMumbai.id, orderType: "B2B", baseRatePerKg: 17, minCharge: 65 },
    // Inter-zone within Bengaluru
    { fromZoneId: zoneNorth.id, toZoneId: zoneSouth.id, orderType: "B2C", baseRatePerKg: 30, minCharge: 60 },
    { fromZoneId: zoneSouth.id, toZoneId: zoneNorth.id, orderType: "B2C", baseRatePerKg: 30, minCharge: 60 },
    { fromZoneId: zoneNorth.id, toZoneId: zoneSouth.id, orderType: "B2B", baseRatePerKg: 24, minCharge: 90 },
    { fromZoneId: zoneSouth.id, toZoneId: zoneNorth.id, orderType: "B2B", baseRatePerKg: 24, minCharge: 90 },
    // Inter-city (Bengaluru <-> Mumbai)
    { fromZoneId: zoneNorth.id, toZoneId: zoneMumbai.id, orderType: "B2C", baseRatePerKg: 60, minCharge: 150 },
    { fromZoneId: zoneMumbai.id, toZoneId: zoneNorth.id, orderType: "B2C", baseRatePerKg: 60, minCharge: 150 },
    { fromZoneId: zoneSouth.id, toZoneId: zoneMumbai.id, orderType: "B2C", baseRatePerKg: 60, minCharge: 150 },
    { fromZoneId: zoneMumbai.id, toZoneId: zoneSouth.id, orderType: "B2C", baseRatePerKg: 60, minCharge: 150 },
    { fromZoneId: zoneNorth.id, toZoneId: zoneMumbai.id, orderType: "B2B", baseRatePerKg: 50, minCharge: 200 },
    { fromZoneId: zoneMumbai.id, toZoneId: zoneNorth.id, orderType: "B2B", baseRatePerKg: 50, minCharge: 200 },
    { fromZoneId: zoneSouth.id, toZoneId: zoneMumbai.id, orderType: "B2B", baseRatePerKg: 50, minCharge: 200 },
    { fromZoneId: zoneMumbai.id, toZoneId: zoneSouth.id, orderType: "B2B", baseRatePerKg: 50, minCharge: 200 },
  ];

  for (const row of rateCardRows) {
    await prisma.rateCard.upsert({
      where: {
        fromZoneId_toZoneId_orderType: {
          fromZoneId: row.fromZoneId,
          toZoneId: row.toZoneId,
          orderType: row.orderType,
        },
      },
      update: { baseRatePerKg: row.baseRatePerKg, minCharge: row.minCharge },
      create: row,
    });
  }

  // ---------------- COD Surcharge Config ----------------
  await prisma.codSurchargeConfig.upsert({
    where: { orderType: "B2C" },
    update: {},
    create: { orderType: "B2C", flatFee: 15, percentOfCharge: 2 },
  });
  await prisma.codSurchargeConfig.upsert({
    where: { orderType: "B2B" },
    update: {},
    create: { orderType: "B2B", flatFee: 25, percentOfCharge: 1.5 },
  });

  // ---------------- Sample Agent ----------------
  const agentEmail = "agent1@lastmile.com";
  const agentPassword = "Agent@123";
  const existingAgentUser = await prisma.user.findUnique({ where: { email: agentEmail } });
  if (!existingAgentUser) {
    const agentHash = await bcrypt.hash(agentPassword, 10);
    const agentUser = await prisma.user.create({
      data: {
        name: "Ravi Kumar",
        email: agentEmail,
        passwordHash: agentHash,
        phone: "9999999999",
        role: "AGENT",
      },
    });
    await prisma.agent.create({
      data: { userId: agentUser.id, currentZoneId: zoneNorth.id, availability: "AVAILABLE" },
    });
    console.log(`Sample agent ready: ${agentEmail} / ${agentPassword}`);
  }

  console.log("Seeding complete.");
  console.log(`Admin login -> email: ${adminEmail}  password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
