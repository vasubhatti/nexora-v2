import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import api from "../api/axios.js";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", { token, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Link may be expired.");
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 16, color: "#f87171", marginBottom: 16 }}>Invalid reset link.</p>
        <Link to="/login" style={{ color: "#a1a1aa", fontSize: 14 }}>Back to login</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22 }}>🔑</span>
        </div>

        {success ? (
          <div>
            <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={24} style={{ color: "#4ade80" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Password reset!</h2>
            <p style={{ fontSize: 14, color: "#71717a" }}>Redirecting to login...</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Set new password</h2>
            <p style={{ fontSize: 14, color: "#71717a", marginBottom: 28 }}>Choose a strong password for your account.</p>

            {error && (
              <div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="New password" required
                  style={{ width: "100%", padding: "13px 48px 13px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 15, outline: "none", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex" }}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <input
                type="password" value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirm new password" required
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 15, outline: "none", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button type="submit" disabled={loading}
                style={{
                  padding: "13px", borderRadius: 12, border: "none",
                  background: "#fff", color: "#000", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResetPassword;