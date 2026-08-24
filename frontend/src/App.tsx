import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NewOrderPage from "./pages/customer/NewOrderPage";
import OrderListPage from "./pages/customer/OrderListPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminZonesPage from "./pages/admin/AdminZonesPage";
import AdminRateCardsPage from "./pages/admin/AdminRateCardsPage";
import AdminAgentsPage from "./pages/admin/AdminAgentsPage";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin/orders" replace />;
  if (user.role === "AGENT") return <Navigate to="/agent" replace />;
  return <Navigate to="/orders" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/orders/new" element={
              <ProtectedRoute allow={["CUSTOMER"]}><NewOrderPage /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allow={["CUSTOMER"]}><OrderListPage /></ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute allow={["CUSTOMER", "AGENT", "ADMIN"]}><OrderDetailPage /></ProtectedRoute>
            } />

            <Route path="/agent" element={
              <ProtectedRoute allow={["AGENT"]}><AgentDashboard /></ProtectedRoute>
            } />

            <Route path="/admin/orders" element={
              <ProtectedRoute allow={["ADMIN"]}><AdminOrdersPage /></ProtectedRoute>
            } />
            <Route path="/admin/zones" element={
              <ProtectedRoute allow={["ADMIN"]}><AdminZonesPage /></ProtectedRoute>
            } />
            <Route path="/admin/rate-cards" element={
              <ProtectedRoute allow={["ADMIN"]}><AdminRateCardsPage /></ProtectedRoute>
            } />
            <Route path="/admin/agents" element={
              <ProtectedRoute allow={["ADMIN"]}><AdminAgentsPage /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
