import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { extractErrorMessage } from "../../api/client";

export default function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [submitting,setSubmitting]=useState(false);
  const handleSubmit=async(e:FormEvent)=>{e.preventDefault();setError("");setSubmitting(true);try{const user=await login(email,password);if(user.role==="ADMIN")navigate("/admin/orders");else if(user.role==="AGENT")navigate("/agent");else navigate("/orders");}catch(err){setError(extractErrorMessage(err));}finally{setSubmitting(false);}};
  return <div className="auth-page"><div className="auth-card">
    <div className="auth-logo"><span className="brand-mark">LM</span><span><strong>LastMile</strong><small>Delivery Tracker</small></span></div>
    <h1>Welcome back</h1><p className="text-sm text-slate-400 mt-2 mb-7">Sign in to manage your deliveries.</p>
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="block mb-2">Email address</label><input type="email" required className="w-full px-4 py-3" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
      <div><label className="block mb-2">Password</label><input type="password" required className="w-full px-4 py-3" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/></div>
      {error&&<p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button disabled={submitting} className="w-full bg-brand-600 text-white rounded-xl py-3 font-bold shadow-sm disabled:opacity-60">{submitting?"Signing in...":"Sign in"}</button>
    </form>
    <p className="text-sm text-slate-400 mt-6 text-center">New customer? <Link to="/register" className="text-blue-600 font-bold">Create an account</Link></p>
  </div></div>;
}
