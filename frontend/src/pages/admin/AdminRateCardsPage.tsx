import { FormEvent, useEffect, useState } from "react";
import { api, extractErrorMessage } from "../../api/client";
import { Zone, OrderType } from "../../types";

interface RateCardRow {
  id: string;
  fromZone: Zone;
  toZone: Zone;
  orderType: OrderType;
  baseRatePerKg: string;
  minCharge: string;
}
interface CodConfigRow {
  orderType: OrderType;
  flatFee: string;
  percentOfCharge: string;
}

export default function AdminRateCardsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [rateCards, setRateCards] = useState<RateCardRow[]>([]);
  const [codConfigs, setCodConfigs] = useState<CodConfigRow[]>([]);
  const [error, setError] = useState("");

  const [rc, setRc] = useState({ fromZoneId: "", toZoneId: "", orderType: "B2C" as OrderType, baseRatePerKg: "", minCharge: "" });
  const [cod, setCod] = useState({ orderType: "B2C" as OrderType, flatFee: "", percentOfCharge: "" });

  const load = () => {
    api.get("/admin/zones").then(({ data }) => setZones(data.zones));
    api.get("/admin/rate-cards").then(({ data }) => setRateCards(data.rateCards));
    api.get("/admin/cod-config").then(({ data }) => setCodConfigs(data.configs));
  };
  useEffect(load, []);

  const handleRateCardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/rate-cards", {
        fromZoneId: rc.fromZoneId,
        toZoneId: rc.toZoneId,
        orderType: rc.orderType,
        baseRatePerKg: Number(rc.baseRatePerKg),
        minCharge: Number(rc.minCharge),
      });
      load();
    } catch (err) { setError(extractErrorMessage(err)); }
  };

  const handleCodSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/cod-config", {
        orderType: cod.orderType,
        flatFee: Number(cod.flatFee),
        percentOfCharge: Number(cod.percentOfCharge),
      });
      load();
    } catch (err) { setError(extractErrorMessage(err)); }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      <h1 className="text-xl font-bold">Rate cards & COD surcharge</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleRateCardSubmit} className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Add / update rate card</h2>
        <p className="text-xs text-slate-500">Set From = To for an intra-zone rate.</p>
        <div className="grid grid-cols-5 gap-3">
          <select required className="border rounded-md px-3 py-2" value={rc.fromZoneId} onChange={(e) => setRc({ ...rc, fromZoneId: e.target.value })}>
            <option value="">From zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <select required className="border rounded-md px-3 py-2" value={rc.toZoneId} onChange={(e) => setRc({ ...rc, toZoneId: e.target.value })}>
            <option value="">To zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2" value={rc.orderType} onChange={(e) => setRc({ ...rc, orderType: e.target.value as OrderType })}>
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
          <input required type="number" min="0" step="0.5" placeholder="₹/kg" className="border rounded-md px-3 py-2" value={rc.baseRatePerKg} onChange={(e) => setRc({ ...rc, baseRatePerKg: e.target.value })} />
          <input required type="number" min="0" step="0.5" placeholder="Min charge ₹" className="border rounded-md px-3 py-2" value={rc.minCharge} onChange={(e) => setRc({ ...rc, minCharge: e.target.value })} />
        </div>
        <button className="bg-brand-600 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-700">Save rate card</button>
      </form>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Configured rate cards</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-1">From</th><th>To</th><th>Type</th><th>₹/kg</th><th>Min ₹</th></tr>
          </thead>
          <tbody>
            {rateCards.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-1.5">{r.fromZone.name}</td>
                <td>{r.toZone.name}</td>
                <td>{r.orderType}</td>
                <td>{r.baseRatePerKg}</td>
                <td>{r.minCharge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCodSubmit} className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">COD surcharge config</h2>
        <div className="grid grid-cols-3 gap-3">
          <select className="border rounded-md px-3 py-2" value={cod.orderType} onChange={(e) => setCod({ ...cod, orderType: e.target.value as OrderType })}>
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
          <input required type="number" min="0" step="0.5" placeholder="Flat fee ₹" className="border rounded-md px-3 py-2" value={cod.flatFee} onChange={(e) => setCod({ ...cod, flatFee: e.target.value })} />
          <input required type="number" min="0" max="100" step="0.1" placeholder="% of charge" className="border rounded-md px-3 py-2" value={cod.percentOfCharge} onChange={(e) => setCod({ ...cod, percentOfCharge: e.target.value })} />
        </div>
        <button className="bg-brand-600 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-700">Save COD config</button>
      </form>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Current COD config</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr><th className="py-1">Type</th><th>Flat fee</th><th>%</th></tr></thead>
          <tbody>
            {codConfigs.map((c) => (
              <tr key={c.orderType} className="border-t">
                <td className="py-1.5">{c.orderType}</td><td>₹{c.flatFee}</td><td>{c.percentOfCharge}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
