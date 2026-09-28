import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, RefreshCw } from "lucide-react";
import api from "../../api/axios.js";

// ── OTP Step ──────────────────────────────────────────────
const AdminOTPStep = ({ email, onVerify, onResend, loading }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef([]);

  useState(() => {
    const t = setInterval(() => setResendTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  });

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(d => d)) submit(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { setOtp(p.split("")); submit(p); }
  };

  const submit = async (code) => {
    setError(null);
    try { await onVerify(code); }
    catch (err) {
      setError(err.message || "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
      }}>
        🔐
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        Verify your identity
      </h2>
      <p style={{ fontSize: 13, color: "#71717a", marginBottom: 28, lineHeight: 1.6 }}>
        A 6-digit code was sent to<br />
        <strong style={{ color: "#a1a1aa" }}>{email}</strong>
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1} value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: 46, height: 54, textAlign: "center",
              fontSize: 20, fontWeight: 700, fontFamily: "monospace",
              caretColor: "transparent",
              background: digit ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${digit ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10, color: "#fff", outline: "none", transition: "all 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(255,255,255,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.06)"; }}
            onBlur={e => { e.target.style.borderColor = digit ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
          />
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, fontSize: 13, color: "#71717a" }}>
          <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
          Verifying...
        </div>
      )}

      <button
        onClick={async () => {
          if (resendTimer > 0) return;
          await onResend();
          setResendTimer(60);
          setOtp(["", "", "", "", "", ""]);
        }}
        disabled={resendTimer > 0}
        style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto", fontSize: 13, color: resendTimer > 0 ? "#3f3f46" : "#a1a1aa", background: "none", border: "none", cursor: resendTimer > 0 ? "default" : "pointer", padding: 0 }}
      >
        <RefreshCw size={12} />
        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
      </button>
    </div>
  );
};

// ── Main Admin Login ──────────────────────────────────────
const AdminLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("credentials");
  const [form, setForm] = useState({ email: "", password: "" });
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", form);

      if (data.requiresOTP) {
        setMaskedEmail(data.email);
        setStep("otp");
      } else {
        // Fallback — should not happen with new 2FA flow
        if (data.user?.role !== "admin") {
          setError("Access denied. Admins only.");
          return;
        }
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (otp) => {
    setOtpLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email: form.email, otp });

      // Check admin role after OTP verified
      if (data.user?.role !== "admin") {
        throw new Error("Access denied. Admins only.");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      navigate("/admin/dashboard");
    } catch (err) {
      setOtpLoading(false);
      throw new Error(err.response?.data?.message || err.message || "Invalid code.");
    }
  };

  const handleResendOTP = async () => {
    try { await api.post("/auth/resend-otp", { email: form.email }); } catch {}
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {step === "otp" ? (
          <AdminOTPStep
            email={maskedEmail}
            onVerify={handleVerifyOTP}
            onResend={handleResendOTP}
            loading={otpLoading}
          />
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={22} style={{ color: "#e4e4e7" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Admin Panel</h1>
              <p style={{ fontSize: 13, color: "#71717a" }}>Nexora V2 · Restricted Access</p>
            </div>

            {error && (
              <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email" value={form.email} placeholder="Admin email"
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <input
                type="password" value={form.password} placeholder="Password"
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button type="submit" disabled={loading || !form.email || !form.password}
                style={{
                  padding: "13px", borderRadius: 12, border: "none", marginTop: 4,
                  background: form.email && form.password ? "#fff" : "rgba(255,255,255,0.08)",
                  color: form.email && form.password ? "#000" : "#52525b",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {loading
                  ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                  : "Sign In"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 12, color: "#3f3f46", marginTop: 20 }}>
              🔒 2FA verification required · Admin accounts only
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;