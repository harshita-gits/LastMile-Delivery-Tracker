import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-brand-600">
          Last-Mile Delivery
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user?.role === "CUSTOMER" && (
            <>
              <Link to="/orders/new" className="hover:text-brand-600">New Order</Link>
              <Link to="/orders" className="hover:text-brand-600">My Orders</Link>
            </>
          )}
          {user?.role === "AGENT" && (
            <Link to="/agent" className="hover:text-brand-600">My Deliveries</Link>
          )}
          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin/orders" className="hover:text-brand-600">Orders</Link>
              <Link to="/admin/zones" className="hover:text-brand-600">Zones</Link>
              <Link to="/admin/rate-cards" className="hover:text-brand-600">Rate Cards</Link>
              <Link to="/admin/agents" className="hover:text-brand-600">Agents</Link>
            </>
          )}
          {user ? (
            <>
              <span className="text-slate-500">{user.name} ({user.role})</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-brand-600">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
