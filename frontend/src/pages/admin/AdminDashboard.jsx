import { useState, useEffect } from "react";
import { Users, MessageSquare, Zap, Code, TrendingUp, Activity, UserX } from "lucide-react";
import AdminLayout from "./AdminLayout.jsx";
import Spinner from "../../components/Spinner.jsx";
import api from "../../api/axios.js";

const StatCard = ({ label, value, icon: Icon, color = "#52525b", sub }) => (
  <div style={{
    padding: 20, borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: "#52525b", fontWeight: 500 }}>{label}</span>
      <Icon size={15} style={{ color }} />
    </div>
    <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
    {sub && <p style={{ fontSize: 12, color: "#3f3f46" }}>{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => {
      setStats(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div style={{ padding: "32px 28px", maxWidth: 1000 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#71717a" }}>Platform overview and statistics</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
            <Spinner size={28} />
          </div>
        ) : (
          <>
            {/* Main stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
              <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} color="#60a5fa" sub="registered accounts" />
              <StatCard label="Active Users" value={stats?.activeUsers} icon={Activity} color="#4ade80" sub="not banned" />
              <StatCard label="Banned Users" value={stats?.bannedUsers} icon={UserX} color="#f87171" sub="suspended" />
              <StatCard label="Total Messages" value={stats?.totalMessages} icon={MessageSquare} color="#a78bfa" sub="all time" />
              <StatCard label="Conversations" value={stats?.totalConversations} icon={TrendingUp} color="#fb923c" sub="all chats" />
              <StatCard label="Code Projects" value={stats?.totalProjects} icon={Code} color="#facc15" sub="created" />
              <StatCard label="Credits Used" value={stats?.totalCreditsUsed} icon={Zap} color="#52525b" sub="platform total" />
              <StatCard label="New Today" value={stats?.newUsersToday} icon={Users} color="#4ade80" sub="new users today" />
            </div>

            {/* Subscription breakdown */}
            <div style={{
              padding: 24, borderRadius: 16, marginTop: 24,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 20 }}>
                Subscription Breakdown
              </h2>
              {[
                { key: "free", label: "Free", color: "#71717a" },
                { key: "pro", label: "Pro", color: "#60a5fa" },
                { key: "enterprise", label: "Enterprise", color: "#a78bfa" },
              ].map(plan => {
                const count = stats?.subscriptions?.[plan.key] || 0;
                const pct = stats?.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                return (
                  <div key={plan.key} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#a1a1aa" }}>{plan.label}</span>
                      <span style={{ fontSize: 13, color: "#52525b" }}>{count} users · {pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "#1a1a1a", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 999, background: plan.color,
                        width: `${pct}%`, transition: "width 0.8s",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;