import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client";
import { Order, OrderStatus } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const AGENT_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ASSIGNED: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
};

const ALL_STATUSES: OrderStatus[] = [
  "CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RESCHEDULED",
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>("CREATED");
  const [failureReason, setFailureReason] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!order) return <p className="text-center mt-16 text-slate-500">Loading...</p>;

  const runAction = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAgentStatusUpdate = (status: OrderStatus) =>
    runAction(async () => {
      await api.patch(`/orders/${order.id}/status`, {
        status,
        failureReason: status === "FAILED" ? failureReason || "Not specified" : undefined,
      });
    });

  const handleReschedule = () =>
    runAction(async () => {
      await api.post(`/orders/${order.id}/reschedule`, {
        newDate: new Date(rescheduleDate).toISOString(),
      });
    });

  const handleAutoAssign = () =>
    runAction(async () => {
      await api.post(`/orders/${order.id}/assign`, { auto: true });
    });

  const handleOverride = () =>
    runAction(async () => {
      await api.patch(`/orders/${order.id}/override`, { status: overrideStatus });
    });

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Pickup</dt>
          <dd>{order.pickupAddress} ({order.pickupZone?.name ?? order.pickupPincode})</dd>
          <dt className="text-slate-500">Drop</dt>
          <dd>{order.dropAddress} ({order.dropZone?.name ?? order.dropPincode})</dd>
          <dt className="text-slate-500">Billable weight</dt>
          <dd>{order.billableWeightKg} kg</dd>
          <dt className="text-slate-500">Order / Payment type</dt>
          <dd>{order.orderType} / {order.paymentType}</dd>
          <dt className="text-slate-500">Total charge</dt>
          <dd className="font-semibold">₹{order.totalCharge}</dd>
          {order.assignedAgent && (
            <>
              <dt className="text-slate-500">Delivery agent</dt>
              <dd>{order.assignedAgent.user.name} {order.assignedAgent.user.phone ? `(${order.assignedAgent.user.phone})` : ""}</dd>
            </>
          )}
          {order.failureReason && (
            <>
              <dt className="text-slate-500">Failure reason</dt>
              <dd>{order.failureReason}</dd>
            </>
          )}
        </dl>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Customer: reschedule after failed delivery */}
      {user?.role === "CUSTOMER" && order.status === "FAILED" && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Reschedule delivery</h2>
          <div className="flex gap-3">
            <input
              type="date"
              className="border rounded-md px-3 py-2"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
            <button
              disabled={busy || !rescheduleDate}
              onClick={handleReschedule}
              className="bg-orange-600 text-white rounded-md px-4 py-2 font-medium hover:bg-orange-700 disabled:opacity-60"
            >
              Reschedule
            </button>
          </div>
        </div>
      )}

      {/* Admin: manual auto-assign trigger + override */}
      {user?.role === "ADMIN" && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Admin controls</h2>
          {!order.assignedAgent && order.status === "CREATED" && (
            <button
              disabled={busy}
              onClick={handleAutoAssign}
              className="bg-slate-800 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-900 disabled:opacity-60"
            >
              Auto-assign nearest agent
            </button>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Override status</label>
            <div className="flex gap-3">
              <select
                className="border rounded-md px-3 py-2"
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                disabled={busy}
                onClick={handleOverride}
                className="bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                Force status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent: move order through lifecycle */}
      {user?.role === "AGENT" && AGENT_NEXT_STATUS[order.status] && (
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Update delivery status</h2>
          {AGENT_NEXT_STATUS[order.status]?.includes("FAILED") && (
            <input
              placeholder="Failure reason (only needed if marking Failed)"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
            />
          )}
          <div className="flex gap-3">
            {AGENT_NEXT_STATUS[order.status]!.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => handleAgentStatusUpdate(s)}
                className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                  s === "FAILED" ? "bg-red-600 text-white hover:bg-red-700" : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                Mark {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracking timeline */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Tracking timeline</h2>
        <ol className="space-y-4">
          {order.statusHistory?.map((h) => (
            <li key={h.id} className="flex gap-3 text-sm">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-600 flex-shrink-0" />
              <div>
                <p className="font-medium">{h.status.replace(/_/g, " ")}</p>
                <p className="text-slate-500">
                  {new Date(h.createdAt).toLocaleString()} {h.actorRole ? `· by ${h.actorRole}` : ""}
                </p>
                {h.note && <p className="text-slate-600">{h.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
