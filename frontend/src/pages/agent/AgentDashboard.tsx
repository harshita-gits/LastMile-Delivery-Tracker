import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Order, AgentAvailability } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";

export default function AgentDashboard(){
 const [orders,setOrders]=useState<Order[]>([]);const [availability,setAvailability]=useState<AgentAvailability>("AVAILABLE");const [loading,setLoading]=useState(true);
 const load=()=>Promise.all([api.get("/agents/my-orders"),api.get("/agents/me")]).then(([a,b])=>{setOrders(a.data.orders);setAvailability(b.data.agent.availability)}).finally(()=>setLoading(false));
 useEffect(load,[]);
 const toggle=async(v:AgentAvailability)=>{setAvailability(v);await api.patch("/agents/me",{availability:v});};
 if(loading)return <div className="page-shell"><div className="card p-8 text-center text-slate-500">Loading deliveries...</div></div>;
 const active=orders.filter(o=>!['DELIVERED','FAILED'].includes(o.status));const past=orders.filter(o=>['DELIVERED','FAILED'].includes(o.status));
 return <div className="page-shell"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Agent workspace</p><h1 className="page-title mt-2">Your delivery route</h1><p className="page-subtitle">Stay on top of assigned shipments and status updates.</p></div><div className="card px-4 py-3 flex items-center gap-3"><span className="text-xs font-bold text-slate-500">Availability</span><select className="px-3 py-2 text-sm" value={availability} onChange={e=>toggle(e.target.value as AgentAvailability)}><option value="AVAILABLE">Available</option><option value="BUSY">Busy</option><option value="OFFLINE">Offline</option></select></div></div>
 <div className="stat-grid"><div className="stat-card"><div className="stat-label">Assigned</div><div className="stat-value">{orders.length}</div><div className="stat-note">Total shipments</div></div><div className="stat-card"><div className="stat-label">Active</div><div className="stat-value">{active.length}</div><div className="stat-note">Need action</div></div><div className="stat-card"><div className="stat-label">Delivered</div><div className="stat-value">{orders.filter(o=>o.status==='DELIVERED').length}</div><div className="stat-note">Completed</div></div><div className="stat-card"><div className="stat-label">Exceptions</div><div className="stat-value">{orders.filter(o=>o.status==='FAILED').length}</div><div className="text-xs mt-1 text-slate-400">Failed deliveries</div></div></div>
 <section className="mb-7"><div className="flex justify-between items-center mb-3"><h2 className="section-title">Active deliveries</h2><span className="text-xs text-slate-400">{active.length} active</span></div><OrderTable orders={active}/></section><section><div className="flex justify-between items-center mb-3"><h2 className="section-title">Completed deliveries</h2><span className="text-xs text-slate-400">{past.length} completed</span></div><OrderTable orders={past}/></section>
 </div>;
}
function OrderTable({orders}:{orders:Order[]}){if(!orders.length)return <div className="card p-8 text-center text-sm text-slate-400">No deliveries in this section.</div>;return <div className="card order-list-card">{orders.map(o=><Link key={o.id} to={`/orders/${o.id}`} className="order-row"><div><p className="order-id">{o.orderNumber}</p><p className="order-route">{o.customer?.name} · {o.dropAddress}</p></div><div className="flex items-center gap-4"><StatusBadge status={o.status}/><span className="text-slate-300">›</span></div></Link>)}</div>}
