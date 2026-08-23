import { OrderStatus } from "../types";

const STYLES: Record<OrderStatus, string> = {
  CREATED: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-indigo-100 text-indigo-700",
  IN_TRANSIT: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-orange-100 text-orange-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STYLES[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
