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

  if (loading) return <p className="text-center mt-16 text-slate-500">Loading orders...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My orders</h1>
        <Link to="/orders/new" className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-brand-700">
          + New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-slate-500">No orders yet.</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  {o.pickupZone?.name ?? o.pickupPincode} → {o.dropZone?.name ?? o.dropPincode}
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
