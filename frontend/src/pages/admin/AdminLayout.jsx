import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, Shield, Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Users", icon: Users, path: "/admin/users" },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    navigate("/admin");
  };

  const admin = JSON.parse(localStorage.getItem("admin_user") || "{}");

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#111", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={14} style={{ color: "#000" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Nexora Admin</p>
            <p style={{ fontSize: 10, color: "#52525b" }}>Control Panel</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "#71717a" }} className="admin-close-btn">
          <X size={16} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, background: active ? "rgba(255,255,255,0.08)" : "transparent", color: active ? "#e4e4e7" : "#71717a", textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "all 0.15s" }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={15} />{item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#e4e4e7" }}>
            {admin?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin?.name}</p>
            <p style={{ fontSize: 10, color: "#52525b" }}>Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.04)", color: "#71717a", cursor: "pointer", fontSize: 12, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e4e4e7"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#71717a"; }}
        >
          <LogOut size={13} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", overflow: "hidden" }}>
      <style>{`
        .admin-sidebar { width: 220px; flex-shrink: 0; }
        .admin-mobile-btn { display: none !important; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-mobile-btn { display: flex !important; }
          .admin-close-btn { display: flex !important; }
          .admin-mobile-drawer { display: flex !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <div className="admin-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.7)" }} className="admin-mobile-drawer" />
      )}

      {/* Mobile drawer */}
      <div className="admin-mobile-drawer" style={{
        display: "none",
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", color: "#f5f5f5", minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="admin-mobile-btn" style={{ alignItems: "center", gap: 12, padding: "0 16px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: 4 }}>
            <Menu size={18} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={11} style={{ color: "#000" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Nexora Admin</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;