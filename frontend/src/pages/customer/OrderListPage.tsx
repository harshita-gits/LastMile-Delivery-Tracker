import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Order } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders").then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-shell"><div className="card p-8 text-center text-slate-500">Loading your shipments...</div></div>;

  const delivered = orders.filter(o => o.status === "DELIVERED").length;
  const active = orders.filter(o => !["DELIVERED", "FAILED"].includes(o.status)).length;
  const exceptions = orders.filter(o => o.status === "FAILED").length;

  return (
    <div className="page-shell">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Customer workspace</p><h1 className="page-title mt-2">Good to see you back 👋</h1><p className="page-subtitle">Track every shipment from pickup to delivery.</p></div>
        <Link to="/orders/new" className="bg-brand-600 text-white rounded-xl px-5 py-3 text-sm font-bold shadow-sm">+ Create shipment</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total shipments</div><div className="stat-value">{orders.length}</div><div className="stat-note">All time</div></div>
        <div className="stat-card"><div className="stat-label">In progress</div><div className="stat-value">{active}</div><div className="stat-note">Currently moving</div></div>
        <div className="stat-card"><div className="stat-label">Delivered</div><div className="stat-value">{delivered}</div><div className="stat-note">Successfully completed</div></div>
        <div className="stat-card"><div className="stat-label">Exceptions</div><div className="stat-value">{exceptions}</div><div className={exceptions ? "text-red-500 text-xs mt-1" : "stat-note"}>{exceptions ? "Needs attention" : "Everything looks good"}</div></div>
      </div>

      <div className="card order-list-card">
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100"><div><h2 className="section-title">Recent shipments</h2><p className="text-xs text-slate-400 mt-1">Your latest delivery activity</p></div><span className="text-xs font-bold text-blue-600">{orders.length} total</span></div>
        {orders.length === 0 ? (
          <div className="p-12 text-center"><div className="text-4xl mb-3">📦</div><p className="font-bold text-slate-700">No shipments yet</p><p className="text-sm text-slate-400 mt-1">Create your first delivery to get started.</p></div>
        ) : orders.map(o => (
          <Link key={o.id} to={`/orders/${o.id}`} className="order-row">
            <div><p className="order-id">{o.orderNumber}</p><p className="order-route">{o.pickupZone?.name ?? o.pickupPincode} <span className="text-blue-400">→</span> {o.dropZone?.name ?? o.dropPincode}</p></div>
            <div className="flex items-center gap-5"><span className="font-bold text-sm text-slate-700">₹{o.totalCharge}</span><StatusBadge status={o.status} /><span className="text-slate-300">›</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
