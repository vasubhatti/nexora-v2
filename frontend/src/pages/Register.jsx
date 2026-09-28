import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, RefreshCw } from "lucide-react";
import useAuthStore from "../store/authStore.js";
import api from "../api/axios.js";

const PERKS = [
  "100 free credits every month",
  "All 15+ AI tools included",
  "Persistent chat history",
  "Code workspace with AI assist",
  "2FA security on every login",
];

// ── OTP Step ──────────────────────────────────────────────
const OTPStep = ({ email, onVerify, onResend, loading }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState(null);
  const inputs = [];

  useState(() => {
    const timer = setInterval(() => setResendTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  });

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs[i + 1]?.focus();
    if (next.every(d => d)) handleSubmit(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); handleSubmit(pasted); }
  };

  const handleSubmit = async (code) => {
    setError(null);
    try { await onVerify(code); }
    catch (err) {
      setError(err.message || "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      inputs[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await onResend();
    setResendTimer(60);
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 24 }}>🔐</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Verify your email</h2>
      <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.6, marginBottom: 28 }}>
        We sent a 6-digit code to<br />
        <strong style={{ color: "#a1a1aa" }}>{email}</strong>
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputs[i] = el}
            type="text" inputMode="numeric" maxLength={1} value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: 50, height: 58, textAlign: "center", fontSize: 22,
              fontWeight: 700, fontFamily: "monospace", caretColor: "transparent",
              background: digit ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${digit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12, color: "#fff", outline: "none", transition: "all 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(167,139,250,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = digit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
          />
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, color: "#71717a", fontSize: 13 }}>
          <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
          Verifying...
        </div>
      )}

      <button onClick={handleResend} disabled={resendTimer > 0}
        style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto", fontSize: 13, color: resendTimer > 0 ? "#3f3f46" : "#a1a1aa", background: "none", border: "none", cursor: resendTimer > 0 ? "default" : "pointer" }}>
        <RefreshCw size={13} />
        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
      </button>
    </div>
  );
};

// ── Main Register ─────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [step, setStep] = useState("form");
  const [show, setShow] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    clearError();
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form.name, form.email, form.password);
    if (res.success && res.requiresOTP) {
      setRegisteredEmail(form.email);
      setStep("otp");
    }
  };

  const handleVerifyOTP = async (otp) => {
    setOtpLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email: form.email, otp });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      useAuthStore.setState({ user: data.user, isAuthenticated: true });
      navigate("/chat");
    } catch (err) {
      setOtpLoading(false);
      throw new Error(err.response?.data?.message || "Invalid code.");
    }
  };

  const handleResendOTP = async () => {
    try { await api.post("/auth/resend-otp", { email: form.email }); } catch {}
  };

  const strength = form.password.length >= 8 ? "strong" : form.password.length >= 6 ? "medium" : form.password.length > 0 ? "weak" : null;
  const strengthColors = { weak: "#f87171", medium: "#fbbf24", strong: "#4ade80" };
  const strengthWidths = { weak: "33%", medium: "66%", strong: "100%" };

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 15, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .auth-animate { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .reg-left { display: flex !important; }
        @media (max-width: 768px) { .reg-left { display: none !important; } }
      `}</style>

      {/* Left panel */}
      <div className="reg-left" style={{
        width: "45%", flexShrink: 0, flexDirection: "column",
        justifyContent: "space-between", padding: 48,
        background: "#0d0d0d", borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#000" }}>N</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Nexora AI V2</span>
        </Link>

        <div style={{ maxWidth: 380 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>
            Everything you need.<br />
            <span style={{ color: "#52525b", fontWeight: 300 }}>All in one place.</span>
          </h2>
          <p style={{ fontSize: 14, color: "#71717a", marginBottom: 28, lineHeight: 1.7 }}>
            Join developers and creators using Nexora AI to build, write, and create faster.
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {PERKS.map(p => (
              <li key={p} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#a1a1aa" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={12} style={{ color: "#4ade80" }} />
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: 12, color: "#3f3f46" }}>No credit card required · Free forever plan</p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="auth-animate" style={{ width: "100%", maxWidth: 400 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40, justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#000" }}>N</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Nexora AI V2</span>
          </Link>

          {step === "otp" ? (
            <OTPStep
              email={registeredEmail}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              loading={otpLoading}
            />
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Create an account</h1>
                <p style={{ fontSize: 14, color: "#71717a" }}>Start with 100 free credits · No card required</p>
              </div>

              {error && (
                <div style={{ marginBottom: 20, padding: "11px 16px", borderRadius: 12, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Full name" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Email" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <div>
                  <div style={{ position: "relative" }}>
                    <input type={show ? "text" : "password"} name="password" value={form.password}
                      onChange={handleChange} placeholder="Password (min 6 chars)" required
                      style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                    <button type="button" onClick={() => setShow(s => !s)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex" }}>
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, background: "#1a1a1a", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, width: strengthWidths[strength], background: strengthColors[strength], transition: "all 0.3s" }} />
                      </div>
                      <p style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, textTransform: "capitalize" }}>
                        {strength} password
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || !form.name || !form.email || !form.password}
                  style={{
                    padding: "13px", borderRadius: 12, border: "none", marginTop: 4,
                    background: form.name && form.email && form.password ? "#fff" : "rgba(255,255,255,0.08)",
                    color: form.name && form.email && form.password ? "#000" : "#52525b",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s",
                  }}>
                  {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : "Create account"}
                </button>
              </form>

              <div style={{ position: "relative", margin: "20px 0" }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0a0a0a", padding: "0 12px" }}>
                  <span style={{ fontSize: 12, color: "#52525b" }}>or</span>
                </div>
              </div>

              <a href={`${import.meta.env.VITE_API_URL}/auth/google`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px", borderRadius: 12, textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7", fontSize: 14, fontWeight: 500, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </a>

              <p style={{ textAlign: "center", fontSize: 14, color: "#52525b", marginTop: 24 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#e4e4e7", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;