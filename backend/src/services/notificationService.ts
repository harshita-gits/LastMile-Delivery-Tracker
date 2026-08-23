import nodemailer from "nodemailer";
import { OrderStatus } from "@prisma/client";

// ---------------- Email ----------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const STATUS_COPY: Record<OrderStatus, { subject: string; body: string }> = {
  CREATED: {
    subject: "Order placed successfully",
    body: "Your order has been created and is awaiting agent assignment.",
  },
  ASSIGNED: {
    subject: "Delivery agent assigned",
    body: "A delivery agent has been assigned to your order.",
  },
  PICKED_UP: {
    subject: "Package picked up",
    body: "Your package has been picked up by our delivery agent.",
  },
  IN_TRANSIT: {
    subject: "Package in transit",
    body: "Your package is on its way to the destination hub.",
  },
  OUT_FOR_DELIVERY: {
    subject: "Out for delivery",
    body: "Your package is out for delivery and will arrive shortly.",
  },
  DELIVERED: {
    subject: "Package delivered",
    body: "Your package has been delivered successfully. Thank you!",
  },
  FAILED: {
    subject: "Delivery attempt failed",
    body: "We were unable to deliver your package. You can reschedule from your dashboard.",
  },
  RESCHEDULED: {
    subject: "Delivery rescheduled",
    body: "Your delivery has been rescheduled and a new agent will be assigned.",
  },
};

export async function sendStatusEmail(params: {
  to: string;
  orderNumber: string;
  status: OrderStatus;
  extraNote?: string;
}): Promise<void> {
  const { to, orderNumber, status, extraNote } = params;
  const copy = STATUS_COPY[status];

  const html = `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>${copy.subject}</h2>
      <p>Order <strong>${orderNumber}</strong></p>
      <p>${copy.body}</p>
      ${extraNote ? `<p style="color:#555">${extraNote}</p>` : ""}
      <p style="color:#999;font-size:12px;margin-top:24px;">Last-Mile Delivery Tracker</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `[${orderNumber}] ${copy.subject}`,
      html,
    });
  } catch (err) {
    // Notification failure must never fail the underlying order-status
    // transaction — log and move on. Retried manually / via admin resend in a full build.
    console.error(`Failed to send status email for order ${orderNumber}:`, err);
  }
}

// ---------------- SMS (pluggable) ----------------
// Abstracted behind an interface so a real provider (Twilio, MSG91, etc.)
// can be dropped in without touching call sites. For the 1-day build this
// resolves to a console-log stub — swap `ConsoleSmsProvider` for a real
// implementation when an SMS provider account is available.

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`[SMS STUB] to=${to} message="${message}"`);
  }
}

export const smsProvider: SmsProvider = new ConsoleSmsProvider();

export async function sendStatusSms(params: {
  to: string;
  orderNumber: string;
  status: OrderStatus;
}): Promise<void> {
  const copy = STATUS_COPY[params.status];
  await smsProvider.send(params.to, `[${params.orderNumber}] ${copy.subject}: ${copy.body}`);
}
