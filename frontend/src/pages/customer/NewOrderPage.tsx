import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, extractErrorMessage } from "../../api/client";
import { ChargeBreakdown, OrderType, PaymentType } from "../../types";

const initialForm = {
  pickupAddress: "",
  pickupPincode: "",
  dropAddress: "",
  dropPincode: "",
  lengthCm: "",
  breadthCm: "",
  heightCm: "",
  actualWeightKg: "",
  orderType: "B2C" as OrderType,
  paymentType: "PREPAID" as PaymentType,
};

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [charge, setCharge] = useState<ChargeBreakdown | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setCharge(null); // any change invalidates the previous preview
  };

  const buildPayload = () => ({
    pickupAddress: form.pickupAddress,
    pickupPincode: form.pickupPincode,
    dropAddress: form.dropAddress,
    dropPincode: form.dropPincode,
    dims: {
      lengthCm: Number(form.lengthCm),
      breadthCm: Number(form.breadthCm),
      heightCm: Number(form.heightCm),
      actualWeightKg: Number(form.actualWeightKg),
    },
    orderType: form.orderType,
    paymentType: form.paymentType,
  });

  const handlePreview = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setPreviewing(true);
    try {
      const { data } = await api.post("/orders/preview", buildPayload());
      setCharge(data.charge);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    setError("");
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", buildPayload());
      navigate(`/orders/${data.order.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-xl font-bold mb-6">Place a new order</h1>

      <form onSubmit={handlePreview} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pickup address</label>
            <input required className="w-full border rounded-md px-3 py-2" value={form.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pickup pincode</label>
            <input required className="w-full border rounded-md px-3 py-2" value={form.pickupPincode} onChange={(e) => set("pickupPincode", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Drop address</label>
            <input required className="w-full border rounded-md px-3 py-2" value={form.dropAddress} onChange={(e) => set("dropAddress", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Drop pincode</label>
            <input required className="w-full border rounded-md px-3 py-2" value={form.dropPincode} onChange={(e) => set("dropPincode", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Length (cm)</label>
            <input type="number" min="0" step="0.1" required className="w-full border rounded-md px-3 py-2" value={form.lengthCm} onChange={(e) => set("lengthCm", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Breadth (cm)</label>
            <input type="number" min="0" step="0.1" required className="w-full border rounded-md px-3 py-2" value={form.breadthCm} onChange={(e) => set("breadthCm", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Height (cm)</label>
            <input type="number" min="0" step="0.1" required className="w-full border rounded-md px-3 py-2" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Actual weight (kg)</label>
            <input type="number" min="0" step="0.01" required className="w-full border rounded-md px-3 py-2" value={form.actualWeightKg} onChange={(e) => set("actualWeightKg", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Order type</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.orderType} onChange={(e) => set("orderType", e.target.value)}>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment type</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.paymentType} onChange={(e) => set("paymentType", e.target.value)}>
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button disabled={previewing} className="bg-slate-800 text-white rounded-md px-4 py-2 font-medium hover:bg-slate-900 disabled:opacity-60">
          {previewing ? "Calculating..." : "Calculate charge"}
        </button>
      </form>

      {charge && (
        <div className="mt-6 bg-brand-50 border border-brand-100 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Charge breakdown</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Volumetric weight</dt>
            <dd>{charge.volumetricWeightKg} kg</dd>
            <dt className="text-slate-500">Billable weight</dt>
            <dd>{charge.billableWeightKg} kg</dd>
            <dt className="text-slate-500">Base charge</dt>
            <dd>₹{charge.baseCharge}</dd>
            <dt className="text-slate-500">COD surcharge</dt>
            <dd>₹{charge.codSurcharge}</dd>
            <dt className="font-semibold">Total charge</dt>
            <dd className="font-semibold">₹{charge.totalCharge}</dd>
          </dl>
          <button
            onClick={handleConfirm}
            disabled={placing}
            className="mt-4 bg-brand-600 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {placing ? "Placing order..." : "Confirm & place order"}
          </button>
        </div>
      )}
    </div>
  );
}
