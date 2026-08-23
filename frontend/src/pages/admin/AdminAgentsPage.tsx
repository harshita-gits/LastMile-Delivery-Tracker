import { FormEvent, useEffect, useState } from "react";
import { api, extractErrorMessage } from "../../api/client";
import { Zone } from "../../types";

interface AgentRow {
  id: string;
  availability: string;
  user: { name: string; email: string; phone?: string };
  currentZone?: Zone;
  _count: { orders: number };
}

export default function AdminAgentsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", currentZoneId: "" });

  const load = () => {
    api.get("/admin/zones").then(({ data }) => setZones(data.zones));
    api.get("/admin/agents").then(({ data }) => setAgents(data.agents));
  };
  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/agents", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        currentZoneId: form.currentZoneId || undefined,
      });
      setForm({ name: "", email: "", password: "", phone: "", currentZoneId: "" });
      load();
    } catch (err) { setError(extractErrorMessage(err)); }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-8">
      <h1 className="text-xl font-bold">Delivery agents</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Add agent</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" className="border rounded-md px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="border rounded-md px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" minLength={6} placeholder="Temp password" className="border rounded-md px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Phone" className="border rounded-md px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="border rounded-md px-3 py-2 col-span-2" value={form.currentZoneId} onChange={(e) => setForm({ ...form, currentZoneId: e.target.value })}>
            <option value="">Home zone (optional)</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <button className="bg-brand-600 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-700">Create agent account</button>
      </form>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-3">All agents</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-1">Name</th><th>Zone</th><th>Availability</th><th>Active/Total orders</th></tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="py-1.5">{a.user.name} <span className="text-slate-400">({a.user.email})</span></td>
                <td>{a.currentZone?.name ?? "—"}</td>
                <td>{a.availability}</td>
                <td>{a._count.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
