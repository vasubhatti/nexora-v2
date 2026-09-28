import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Calendar, Zap, Shield,
  Lock, ArrowLeft, Check, Loader2,
  Eye, EyeOff, Trash2, AlertTriangle,
} from "lucide-react";
import Spinner from "../components/Spinner.jsx";
import useAuthStore from "../store/authStore.js";
import useCreditStore from "../store/creditStore.js";
import api from "../api/axios.js";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { fetchBalance } = useCreditStore();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Credit data from API (not store — store may not be loaded yet)
  const [creditData, setCreditData] = useState(null);

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [meRes, creditRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/credits/balance"),
        ]);
        setStats(meRes.data.user);
        setCreditData(creditRes.data.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords don't match." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.message || "Failed to change password." });
    } finally { setPwLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete("/auth/account", {
        data: stats?.hasPassword ? { password: deletePassword } : {},
      });
      await logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account.");
    } finally { setDeleteLoading(false); }
  };

  const creditBalance = creditData?.creditBalance ?? 0;
  const creditsUsed = creditData?.creditsUsed ?? 0;
  const subscription = creditData?.subscription ?? user?.subscription ?? "free";
  const creditsResetDate = creditData?.creditsResetDate;
  const totalCredits = subscription === "pro" ? 1000 : subscription === "enterprise" ? 10000 : 100;
  const creditPct = Math.min((creditBalance / totalCredits) * 100, 100);
  const resetDate = creditsResetDate
    ? new Date(creditsResetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16,
        borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,10,10,0.95)",
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)",
      }}>
        <button onClick={() => navigate("/chat")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#71717a", fontSize: 13, padding: 0, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#e4e4e7"}
          onMouseLeave={e => e.currentTarget.style.color = "#71717a"}
        >
          <ArrowLeft size={14} /> Chat
        </button>
        <span style={{ color: "#27272a" }}>·</span>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: "#e4e4e7" }}>Profile</h1>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <Spinner size={28} />
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 20, marginBottom: 32,
              padding: 24, borderRadius: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 900, color: "#fff", overflow: "hidden",
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{user?.name}</h2>
                  {user?.role === "admin" && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(250,204,21,0.1)", color: "#facc15", border: "1px solid rgba(250,204,21,0.2)" }}>
                      Admin
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: "#71717a", marginBottom: 10 }}>{user?.email}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 12, padding: "4px 12px", borderRadius: 999, fontWeight: 600, textTransform: "capitalize",
                    background: subscription === "pro" ? "rgba(96,165,250,0.1)" : subscription === "enterprise" ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.06)",
                    color: subscription === "pro" ? "#60a5fa" : subscription === "enterprise" ? "#a78bfa" : "#71717a",
                    border: `1px solid ${subscription === "pro" ? "rgba(96,165,250,0.2)" : subscription === "enterprise" ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                    {subscription} plan
                  </span>
                  {stats?.googleId && (
                    <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: "rgba(255,255,255,0.04)", color: "#71717a", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Google account
                    </span>
                  )}
                  {stats?.hasPassword && !stats?.googleId && (
                    <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: "rgba(74,222,128,0.06)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.15)" }}>
                      Email · Password
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["overview", "security", "danger zone"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 18px", borderRadius: "8px 8px 0 0", border: "none",
                    background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    color: activeTab === tab ? "#fff" : "#71717a",
                    borderBottom: activeTab === tab ? "2px solid #fff" : "2px solid transparent",
                    textTransform: "capitalize", transition: "all 0.15s",
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Overview ─── */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Credit overview */}
                <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", marginBottom: 18 }}>Credit Balance</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                    <div style={{ padding: "16px", borderRadius: 12, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}>
                      <p style={{ fontSize: 12, color: "#52525b", marginBottom: 6 }}>Credits Remaining</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: "#4ade80", lineHeight: 1 }}>{creditBalance.toLocaleString()}</p>
                    </div>
                    <div style={{ padding: "16px", borderRadius: 12, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.12)" }}>
                      <p style={{ fontSize: 12, color: "#52525b", marginBottom: 6 }}>Credits Used</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: "#fb923c", lineHeight: 1 }}>{creditsUsed.toLocaleString()}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#71717a" }}>Monthly usage</span>
                      <span style={{ fontSize: 12, color: "#52525b" }}>{creditBalance} / {totalCredits.toLocaleString()} remaining</span>
                    </div>
                    <div style={{ height: 5, background: "#1a1a1a", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 999,
                        background: creditPct < 20 ? "#f87171" : creditPct < 50 ? "#fbbf24" : "#4ade80",
                        width: `${creditPct}%`, transition: "width 0.6s",
                      }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#52525b" }}>
                    Resets on <span style={{ color: "#a1a1aa" }}>{resetDate}</span>
                  </p>
                </div>

                {/* Account info */}
                <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", marginBottom: 18 }}>Account Details</h3>
                  {[
                    { icon: User, label: "Full Name", value: user?.name },
                    { icon: Mail, label: "Email", value: user?.email },
                    { icon: Shield, label: "Role", value: user?.role || "user" },
                    { icon: Calendar, label: "Member since", value: new Date(stats?.createdAt || Date.now()).toLocaleDateString("en-US", { dateStyle: "long" }) },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <Icon size={14} style={{ color: "#52525b", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#52525b", width: 110, flexShrink: 0 }}>{item.label}</span>
                        <span style={{ fontSize: 14, color: "#e4e4e7", textTransform: item.label === "Role" ? "capitalize" : "none" }}>{item.value}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => navigate("/subscription")}
                    style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.06)", color: "#e4e4e7", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  >
                    Manage Subscription
                  </button>
                  <button onClick={async () => { await logout(); navigate("/login"); }}
                    style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#f87171", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.05)"}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* ── Security ─── */}
            {activeTab === "security" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* 2FA status */}
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={16} style={{ color: "#4ade80" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Two-Factor Authentication</p>
                      <p style={{ fontSize: 12, color: "#4ade80" }}>✓ Active — Email OTP on every login</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>
                    Every login sends a 6-digit code to your email. Your account is protected even if your password is compromised.
                  </p>
                </div>

                {/* Change password — only if user has email/password login */}
                {stats?.hasPassword ? (
                  <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Change Password</h3>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>
                      Choose a strong password to keep your account secure.
                    </p>

                    {pwMsg && (
                      <div style={{ marginBottom: 18, padding: "11px 16px", borderRadius: 10, fontSize: 13, background: pwMsg.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${pwMsg.type === "success" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`, color: pwMsg.type === "success" ? "#4ade80" : "#f87171" }}>
                        {pwMsg.type === "success" && <Check size={13} style={{ marginRight: 6, display: "inline" }} />}
                        {pwMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { key: "currentPassword", label: "Current Password", showKey: "current" },
                        { key: "newPassword", label: "New Password", showKey: "new" },
                        { key: "confirmPassword", label: "Confirm New Password", showKey: "confirm" },
                      ].map(field => (
                        <div key={field.key}>
                          <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 6 }}>{field.label}</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showPw[field.showKey] ? "text" : "password"}
                              value={pwForm[field.key]}
                              onChange={e => setPwForm(p => ({ ...p, [field.key]: e.target.value }))}
                              placeholder="••••••••"
                              style={{ ...inputStyle, paddingRight: 48 }}
                              onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                            />
                            <button type="button"
                              onClick={() => setShowPw(p => ({ ...p, [field.showKey]: !p[field.showKey] }))}
                              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex" }}>
                              {showPw[field.showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      ))}

                      <button type="submit" disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                        style={{ padding: "12px", borderRadius: 12, border: "none", marginTop: 4, background: pwForm.currentPassword && pwForm.newPassword ? "#fff" : "rgba(255,255,255,0.07)", color: pwForm.currentPassword && pwForm.newPassword ? "#000" : "#52525b", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                        {pwLoading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : "Update Password"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Lock size={16} style={{ color: "#52525b" }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7" }}>Google Account</p>
                    </div>
                    <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>
                      Your account uses Google Sign-In. To change your password, visit your <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>Google Account settings</a>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Danger Zone ─── */}
            {activeTab === "danger zone" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0 }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Delete Account</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 20 }}>
                    Permanently delete your account and all associated data including conversations, code projects, and credit history. <strong style={{ color: "#f87171" }}>This action cannot be undone.</strong>
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                      borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(239,68,68,0.08)", color: "#f87171",
                      cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                  >
                    <Trash2 size={14} /> Delete my account
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Account Modal ─── */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#111", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, width: "100%", maxWidth: 400, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={18} style={{ color: "#f87171" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Delete Account</h3>
                <p style={{ fontSize: 12, color: "#71717a" }}>This cannot be undone</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 20 }}>
              All your data — conversations, projects, credits — will be permanently deleted.
            </p>

            {deleteError && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {stats?.hasPassword && (
                <div>
                  <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 6 }}>
                    Enter your password to confirm
                  </label>
                  <input
                    type="password" value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                    style={{ ...inputStyle }}
                    onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 6 }}>
                  Type <strong style={{ color: "#f87171" }}>DELETE</strong> to confirm
                </label>
                <input
                  type="text" value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.05em" }}
                  onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); setDeletePassword(""); setDeleteError(null); }}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#a1a1aa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10, border: "none",
                  background: deleteConfirmText === "DELETE" ? "rgba(239,68,68,0.8)" : "rgba(239,68,68,0.15)",
                  color: deleteConfirmText === "DELETE" ? "#fff" : "#f87171",
                  cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                {deleteLoading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <><Trash2 size={13} /> Delete Account</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;