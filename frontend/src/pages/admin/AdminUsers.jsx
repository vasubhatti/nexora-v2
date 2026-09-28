import { useState, useEffect, useRef } from "react";
import { Search, Ban, Trash2, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import AdminLayout from "./AdminLayout.jsx";
import Spinner from "../../components/Spinner.jsx";
import api from "../../api/axios.js";

const SUB_COLORS = {
  free: "#71717a", pro: "#60a5fa", enterprise: "#a78bfa",
};

const UserRow = ({ user, onBan, onDelete, onCredits }) => {
  const [open, setOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: "", type: "add", reason: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleCredits = async () => {
    if (!creditForm.amount) return;
    setLoading(true);
    setMsg(null);
    try {
      await onCredits(user._id, creditForm);
      setMsg({ type: "success", text: "Credits updated." });
      setCreditForm({ amount: "", type: "add", reason: "" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      borderRadius: 12, overflow: "hidden",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      marginBottom: 8,
    }}>
      {/* Row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#e4e4e7", overflow: "hidden",
        }}>
          {user.avatar
            ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : user.name?.[0]?.toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7" }}>{user.name}</span>
            {user.role === "admin" && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: "rgba(250,204,21,0.12)", color: "#facc15", border: "1px solid rgba(250,204,21,0.2)",
              }}>Admin</span>
            )}
            {user.isBanned && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)",
              }}>Banned</span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "capitalize",
              background: `${SUB_COLORS[user.subscription]}18`,
              color: SUB_COLORS[user.subscription],
              border: `1px solid ${SUB_COLORS[user.subscription]}40`,
            }}>
              {user.subscription}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>{user.email}</p>
        </div>

        {/* Credits */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{user.creditBalance}</p>
          <p style={{ fontSize: 11, color: "#3f3f46" }}>credits</p>
        </div>

        {open ? <ChevronUp size={15} style={{ color: "#52525b", flexShrink: 0 }} />
          : <ChevronDown size={15} style={{ color: "#52525b", flexShrink: 0 }} />}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Balance", value: user.creditBalance },
              { label: "Used", value: user.creditsUsed },
              { label: "Plan", value: user.subscription },
              { label: "Joined", value: new Date(user.createdAt).toLocaleDateString() },
            ].map(item => (
              <div key={item.label} style={{
                padding: "10px 12px", borderRadius: 10, textAlign: "center",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <p style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", textTransform: "capitalize" }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Credit controls */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Manage Credits
            </p>

            {msg && (
              <div style={{
                marginBottom: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12,
                background: msg.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
                color: msg.type === "success" ? "#4ade80" : "#f87171",
              }}>{msg.text}</div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Type toggle */}
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                {["add", "deduct"].map(t => (
                  <button key={t} onClick={() => setCreditForm(p => ({ ...p, type: t }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: creditForm.type === t ? "rgba(255,255,255,0.12)" : "transparent",
                      color: creditForm.type === t ? "#e4e4e7" : "#52525b",
                      transition: "all 0.15s",
                    }}>
                    {t === "add" ? <Plus size={11} /> : <Minus size={11} />}
                    {t === "add" ? "Add" : "Deduct"}
                  </button>
                ))}
              </div>

              <input
                type="number" value={creditForm.amount} placeholder="Amount"
                onChange={e => setCreditForm(p => ({ ...p, amount: e.target.value }))}
                style={{
                  width: 90, padding: "6px 10px", borderRadius: 8, fontSize: 13, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none",
                }}
              />

              <input
                value={creditForm.reason} placeholder="Reason (optional)"
                onChange={e => setCreditForm(p => ({ ...p, reason: e.target.value }))}
                style={{
                  flex: 1, minWidth: 120, padding: "6px 10px", borderRadius: 8, fontSize: 13,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none",
                }}
              />

              <button onClick={handleCredits} disabled={loading || !creditForm.amount}
                style={{
                  padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                  background: creditForm.amount ? "#fff" : "rgba(255,255,255,0.07)",
                  color: creditForm.amount ? "#000" : "#52525b",
                  cursor: creditForm.amount ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {loading ? <Spinner size={12} /> : "Apply"}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => onBan(user._id, user.isBanned)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#a1a1aa", cursor: "pointer", fontSize: 13,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(251,146,60,0.4)"; e.currentTarget.style.color = "#fb923c"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              <Ban size={13} />
              {user.isBanned ? "Unban User" : "Ban User"}
            </button>

            {user.role !== "admin" && (
              <button onClick={() => onDelete(user._id, user.name)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)",
                  background: "rgba(239,68,68,0.06)", color: "#f87171", cursor: "pointer", fontSize: 13,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
              >
                <Trash2 size={13} />
                Delete User
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subscription, setSubscription] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append("search", search);
      if (subscription) params.append("subscription", subscription);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, subscription]);

  const handleBan = async (id, isBanned) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/ban`);
      setActionMsg({ type: "success", text: data.message });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned: !isBanned } : u));
    } catch { setActionMsg({ type: "error", text: "Action failed." }); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setActionMsg({ type: "success", text: `${name} deleted.` });
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch { setActionMsg({ type: "error", text: "Delete failed." }); }
  };

  const handleCredits = async (id, form) => {
    const { data } = await api.post(`/admin/users/${id}/credits`, {
      amount: form.amount, type: form.type, reason: form.reason,
    });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, creditBalance: data.data.newBalance } : u));
  };

  return (
    <AdminLayout>
      <div style={{ padding: "32px 28px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Users</h1>
          <p style={{ fontSize: 13, color: "#71717a" }}>{pagination?.total || 0} total users</p>
        </div>

        {actionMsg && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13,
            background: actionMsg.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
            color: actionMsg.type === "success" ? "#4ade80" : "#f87171",
            border: `1px solid ${actionMsg.type === "success" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>
            {actionMsg.text}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#52525b" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setPage(1); fetchUsers(); } }}
              placeholder="Search by name or email..."
              style={{
                width: "100%", padding: "9px 12px 9px 36px", borderRadius: 10, fontSize: 13,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", outline: "none",
              }}
            />
          </div>
          <select
            value={subscription}
            onChange={e => { setSubscription(e.target.value); setPage(1); }}
            style={{
              padding: "9px 14px", borderRadius: 10, fontSize: 13,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e4e4e7", outline: "none",
            }}
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spinner size={24} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ fontSize: 14, color: "#52525b" }}>No users found.</p>
          </div>
        ) : (
          <>
            {users.map(user => (
              <UserRow
                key={user._id} user={user}
                onBan={handleBan} onDelete={handleDelete} onCredits={handleCredits}
              />
            ))}

            {/* Pagination */}
            {pagination?.pages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: page === 1 ? "#3f3f46" : "#a1a1aa",
                    cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13,
                  }}>
                  Previous
                </button>
                <span style={{ fontSize: 13, color: "#52525b" }}>{page} / {pagination.pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: page === pagination.pages ? "#3f3f46" : "#a1a1aa",
                    cursor: page === pagination.pages ? "not-allowed" : "pointer", fontSize: 13,
                  }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;