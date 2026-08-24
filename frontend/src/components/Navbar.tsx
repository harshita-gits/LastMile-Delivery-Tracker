import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const icons: Record<string, string> = {
  dashboard: "⌂",
  orders: "▣",
  tracking: "⌖",
  deliveries: "▰",
  zones: "◈",
  rates: "₹",
  agents: "♙",
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <header className="public-nav">
        <Link to="/login" className="brand-lockup">
          <span className="brand-mark">LM</span>
          <span><strong>LastMile</strong><small>Delivery Tracker</small></span>
        </Link>
        <Link to="/login" className="public-login">Sign in →</Link>
      </header>
    );
  }

  const items = user.role === "CUSTOMER"
    ? [
        { to: "/orders", label: "Dashboard", icon: "dashboard" },
        { to: "/orders", label: "My Orders", icon: "orders" },
        { to: "/orders/new", label: "Create Shipment", icon: "tracking" },
      ]
    : user.role === "AGENT"
      ? [{ to: "/agent", label: "My Deliveries", icon: "deliveries" }]
      : [
          { to: "/admin/orders", label: "Dashboard", icon: "dashboard" },
          { to: "/admin/orders", label: "Orders", icon: "orders" },
          { to: "/admin/zones", label: "Zones & Pincodes", icon: "zones" },
          { to: "/admin/rate-cards", label: "Rate Cards", icon: "rates" },
          { to: "/admin/agents", label: "Delivery Agents", icon: "agents" },
        ];

  return (
    <aside className="app-sidebar">
      <Link to="/" className="brand-lockup sidebar-brand">
        <span className="brand-mark">LM</span>
        <span><strong>LastMile</strong><small>Delivery Tracker</small></span>
      </Link>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-links">
        {items.map((item, index) => {
          const active = location.pathname === item.to || (index === 0 && location.pathname === "/");
          return (
            <Link key={`${item.to}-${item.label}`} to={item.to} className={active ? "sidebar-link active" : "sidebar-link"}>
              <span className="sidebar-icon">{icons[item.icon]}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />
      <div className="user-card">
        <div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div>
        <div className="user-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
        <button className="logout-icon" onClick={handleLogout} title="Logout">↪</button>
      </div>
      <div className="sidebar-footer">© 2026 LastMile<br />Smart delivery operations</div>
    </aside>
  );
}
