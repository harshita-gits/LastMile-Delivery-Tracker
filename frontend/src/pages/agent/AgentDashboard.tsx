import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Order, AgentAvailability } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";

export default function AgentDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availability, setAvailability] = useState<AgentAvailability>("AVAILABLE");
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.get("/agents/my-orders"), api.get("/agents/me")]).then(
      ([ordersRes, profileRes]) => {
        setOrders(ordersRes.data.orders);
        setAvailability(profileRes.data.agent.availability);
      }
    ).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleAvailability = async (value: AgentAvailability) => {
    setAvailability(value);
    await api.patch("/agents/me", { availability: value });
  };

  if (loading) return <p className="text-center mt-16 text-slate-500">Loading...</p>;

  const active = orders.filter((o) => !["DELIVERED", "FAILED"].includes(o.status));
  const past = orders.filter((o) => ["DELIVERED", "FAILED"].includes(o.status));

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My deliveries</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Availability:</span>
          <select
            className="border rounded-md px-2 py-1"
            value={availability}
            onChange={(e) => toggleAvailability(e.target.value as AgentAvailability)}
          >
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      <section>
        <h2 className="font-semibold mb-3 text-slate-700">Active ({active.length})</h2>
        <OrderTable orders={active} />
      </section>

      <section>
        <h2 className="font-semibold mb-3 text-slate-700">Completed ({past.length})</h2>
        <OrderTable orders={past} />
      </section>
    </div>
  );
}

function OrderTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) return <p className="text-slate-400 text-sm">Nothing here.</p>;
  return (
    <div className="bg-white rounded-xl border shadow-sm divide-y">
      {orders.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
          <div>
            <p className="font-medium">{o.orderNumber}</p>
            <p className="text-sm text-slate-500">{o.customer?.name} · {o.dropAddress}</p>
          </div>
          <StatusBadge status={o.status} />
        </Link>
      ))}
    </div>
  );
}
