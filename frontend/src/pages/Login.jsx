import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import useAuthStore from "../store/authStore.js";
import api from "../api/axios.js";

// ── OTP Input ─────────────────────────────────────────────
const OTPInput = ({ onVerify, onResend, email, loading }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState(null);
  const inputs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => setResendTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join("").length === 6) {
      handleSubmit(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (code) => {
    setError(null);
    try {
      await onVerify(code);
    } catch (err) {
      setError(err.message || "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await onResend();
    setResendTimer(60);
    setOtp(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
        background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 22 }}>🔐</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        Check your email
      </h2>
      <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.6, marginBottom: 32, maxWidth: 300, margin: "0 auto 28px" }}>
        We sent a 6-digit code to<br />
        <strong style={{ color: "#a1a1aa" }}>{email}</strong>
      </p>

      {error && (
        <div style={{
          marginBottom: 20, padding: "10px 16px", borderRadius: 10, fontSize: 13,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171",
        }}>
          {error}
        </div>
      )}

      {/* OTP boxes */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: 50, height: 58, textAlign: "center",
              fontSize: 22, fontWeight: 700, fontFamily: "monospace",
              background: digit ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${digit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12, color: "#fff", outline: "none",
              transition: "all 0.15s",
              caretColor: "transparent",
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

      <button
        onClick={handleResend}
        disabled={resendTimer > 0}
        style={{
          display: "flex", alignItems: "center", gap: 6, margin: "0 auto",
          fontSize: 13, color: resendTimer > 0 ? "#3f3f46" : "#a1a1aa",
          background: "none", border: "none", cursor: resendTimer > 0 ? "default" : "pointer",
          padding: 0, transition: "color 0.15s",
        }}
        onMouseEnter={e => { if (!resendTimer) e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { if (!resendTimer) e.currentTarget.style.color = "#a1a1aa"; }}
      >
        <RefreshCw size={13} />
        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
      </button>
    </div>
  );
};

// ── Forgot Password Form ──────────────────────────────────
const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
          background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 22 }}>📧</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Check your email</h2>
        <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.6, marginBottom: 24 }}>
          If <strong style={{ color: "#a1a1aa" }}>{email}</strong> is registered, we've sent a password reset link.
        </p>
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", margin: "0 auto" }}>
          <ArrowLeft size={13} /> Back to login
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 13,
          color: "#71717a", background: "none", border: "none", cursor: "pointer",
          padding: 0, marginBottom: 28, transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#e4e4e7"}
        onMouseLeave={e => e.currentTarget.style.color = "#71717a"}
      >
        <ArrowLeft size={13} /> Back to login
      </button>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Forgot password?</h2>
      <p style={{ fontSize: 14, color: "#71717a", marginBottom: 28, lineHeight: 1.6 }}>
        Enter your email and we'll send a reset link.
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            padding: "13px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f5f5f5", fontSize: 15, outline: "none", fontFamily: "inherit",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <button type="submit" disabled={loading || !email}
          style={{
            padding: "13px", borderRadius: 12, border: "none",
            background: email ? "#fff" : "rgba(255,255,255,0.08)",
            color: email ? "#000" : "#52525b",
            fontSize: 14, fontWeight: 700, cursor: email ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : "Send reset link"}
        </button>
      </form>
    </div>
  );
};

// ── Main Login ────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { login: storeLogin, clearError, error } = useAuthStore();
  const [step, setStep] = useState("credentials"); // credentials | otp | forgot
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [maskedEmail, setMaskedEmail] = useState("");
  const [formError, setFormError] = useState(null);

  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    clearError();
    try {
      const { data } = await api.post("/auth/login", form);
      if (data.requiresOTP) {
        setMaskedEmail(data.email);
        setStep("otp");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Login failed.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (otp) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email: form.email, otp });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      useAuthStore.setState({ user: data.user, isAuthenticated: true });
      navigate("/chat");
    } catch (err) {
      setLoading(false);
      throw new Error(err.response?.data?.message || "Invalid code.");
    }
  };

  const handleResendOTP = async () => {
    try { await api.post("/auth/resend-otp", { email: form.email }); } catch {}
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 15, outline: "none", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .auth-animate { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Left panel */}
      <div style={{
        width: "45%", flexShrink: 0, display: "none", flexDirection: "column",
        justifyContent: "space-between", padding: 48,
        background: "#0d0d0d", borderRight: "1px solid rgba(255,255,255,0.06)",
      }} className="hide-mobile left-panel">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#000" }}>N</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Nexora AI V2</span>
        </Link>

        <div style={{ maxWidth: 380 }}>
          <p style={{ fontSize: 26, fontWeight: 300, color: "#e4e4e7", lineHeight: 1.5, marginBottom: 32 }}>
            "One workspace for chat, code, images, and everything in between."
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { value: "15+", label: "AI tools" },
              { value: "100", label: "Free credits" },
              { value: "2FA", label: "Secured" },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#3f3f46" }}>Nexora AI V2 · MERN Stack · Gemini 2.5</p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="auth-animate" style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40, justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#000" }}>N</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Nexora AI V2</span>
          </Link>

          {step === "forgot" && <ForgotPasswordForm onBack={() => setStep("credentials")} />}

          {step === "otp" && (
            <OTPInput
              email={maskedEmail}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              loading={loading}
            />
          )}

          {step === "credentials" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Welcome back</h1>
                <p style={{ fontSize: 14, color: "#71717a" }}>Sign in to your Nexora AI account</p>
              </div>

              {(formError || error) && (
                <div style={{ marginBottom: 20, padding: "11px 16px", borderRadius: 12, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {formError || error}
                </div>
              )}

              <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  type="email" value={form.email} placeholder="Email"
                  onChange={e => { clearError(); setFormError(null); setForm(p => ({ ...p, email: e.target.value })); }}
                  required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <div style={{ position: "relative" }}>
                  <input
                    type={show ? "text" : "password"} value={form.password}
                    placeholder="Password"
                    onChange={e => { clearError(); setFormError(null); setForm(p => ({ ...p, password: e.target.value })); }}
                    required style={{ ...inputStyle, paddingRight: 48 }}
                    onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex" }}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <div style={{ textAlign: "right" }}>
                  <button type="button" onClick={() => setStep("forgot")}
                    style={{ fontSize: 13, color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#e4e4e7"}
                    onMouseLeave={e => e.currentTarget.style.color = "#71717a"}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading || !form.email || !form.password}
                  style={{
                    padding: "13px", borderRadius: 12, border: "none",
                    background: form.email && form.password ? "#fff" : "rgba(255,255,255,0.08)",
                    color: form.email && form.password ? "#000" : "#52525b",
                    fontSize: 14, fontWeight: 700,
                    cursor: form.email && form.password ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (form.email && form.password) e.currentTarget.style.background = "#e4e4e7"; }}
                  onMouseLeave={e => { if (form.email && form.password) e.currentTarget.style.background = "#fff"; }}
                >
                  {loading
                    ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                    : "Continue"}
                </button>
              </form>

              <div style={{ position: "relative", margin: "20px 0" }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0a0a0a", padding: "0 12px" }}>
                  <span style={{ fontSize: 12, color: "#52525b" }}>or</span>
                </div>
              </div>

              <a href={`${import.meta.env.VITE_API_URL}/auth/google`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  padding: "12px", borderRadius: 12, textDecoration: "none",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e4e4e7", fontSize: 14, fontWeight: 500, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
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
                No account?{" "}
                <Link to="/register" style={{ color: "#e4e4e7", textDecoration: "none", fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                  Sign up free
                </Link>
              </p>

              <p style={{ textAlign: "center", fontSize: 12, color: "#3f3f46", marginTop: 12 }}>
                🔒 2FA verification on every login
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`.left-panel { display: flex !important; } @media (max-width: 768px) { .left-panel { display: none !important; } }`}</style>
    </div>
  );
};

export default Login;