import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Order, OrderStatus, Zone } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";

const STATUSES: OrderStatus[] = [
  "CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RESCHEDULED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [status, setStatus] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/zones").then(({ data }) => setZones(data.zones));
  }, []);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (zoneId) params.zoneId = zoneId;
    api.get("/orders", { params }).then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
  };

  useEffect(load, [status, zoneId]);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h1 className="text-xl font-bold mb-6">All orders</h1>

      <div className="flex gap-3 mb-4">
        <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="border rounded-md px-3 py-2 text-sm" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          <option value="">All pickup zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-slate-500">No orders match these filters.</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  {o.customer?.name} · {o.pickupZone?.name ?? o.pickupPincode} → {o.dropZone?.name ?? o.dropPincode}
                  {o.assignedAgent ? ` · agent: ${o.assignedAgent.user.name}` : " · unassigned"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">₹{o.totalCharge}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
