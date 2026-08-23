import { FormEvent, useEffect, useState } from "react";
import { api, extractErrorMessage } from "../../api/client";
import { Zone } from "../../types";

interface ZoneWithAreas extends Zone {
  areas: { id: string; pincode: string; areaName?: string }[];
}

export default function AdminZonesPage() {
  const [zones, setZones] = useState<ZoneWithAreas[]>([]);
  const [zoneName, setZoneName] = useState("");
  const [zoneCity, setZoneCity] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [pincode, setPincode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get("/admin/zones").then(({ data }) => setZones(data.zones));
  useEffect(() => { load(); }, []);

  const handleCreateZone = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/zones", { name: zoneName, city: zoneCity || undefined });
      setZoneName(""); setZoneCity("");
      load();
    } catch (err) { setError(extractErrorMessage(err)); }
  };

  const handleAddArea = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/zone-areas", { zoneId: selectedZoneId, pincode, areaName: areaName || undefined });
      setPincode(""); setAreaName("");
      load();
    } catch (err) { setError(extractErrorMessage(err)); }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-8">
      <h1 className="text-xl font-bold">Zones & pincode mapping</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleCreateZone} className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Create zone</h2>
        <div className="flex gap-3">
          <input required placeholder="Zone name (e.g. Bengaluru-North)" className="flex-1 border rounded-md px-3 py-2" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
          <input placeholder="City" className="w-40 border rounded-md px-3 py-2" value={zoneCity} onChange={(e) => setZoneCity(e.target.value)} />
          <button className="bg-brand-600 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-700">Add</button>
        </div>
      </form>

      <form onSubmit={handleAddArea} className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Map a pincode to a zone</h2>
        <div className="flex gap-3">
          <select required className="border rounded-md px-3 py-2" value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}>
            <option value="">Select zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <input required placeholder="Pincode" className="w-32 border rounded-md px-3 py-2" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          <input placeholder="Area name (optional)" className="flex-1 border rounded-md px-3 py-2" value={areaName} onChange={(e) => setAreaName(e.target.value)} />
          <button className="bg-brand-600 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-700">Map</button>
        </div>
      </form>

      <div className="space-y-4">
        {zones.map((z) => (
          <div key={z.id} className="bg-white border rounded-xl p-6">
            <p className="font-semibold">{z.name} {z.city && <span className="text-slate-400 font-normal">({z.city})</span>}</p>
            {z.areas.length === 0 ? (
              <p className="text-slate-400 text-sm mt-1">No pincodes mapped yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {z.areas.map((a) => (
                  <span key={a.id} className="text-xs bg-slate-100 rounded-full px-2.5 py-1">
                    {a.pincode} {a.areaName ? `· ${a.areaName}` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
