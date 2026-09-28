import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, ArrowLeft, } from "lucide-react";
import Spinner from "../components/Spinner.jsx";
import useAuthStore from "../store/authStore.js";
import useCreditStore from "../store/creditStore.js";
import api from "../api/axios.js";

const PLAN_COLORS = {
  free: { accent: "#71717a", bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.2)" },
  pro: { accent: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)" },
  enterprise: { accent: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
};



// ── Main Subscription Page ────────────────────────────────
const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchBalance } = useCreditStore();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [message, setMessage] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState(null);

  const currentPlan = user?.subscription || "free";

  useEffect(() => {
    api.get("/subscription/plans").then(({ data }) => {
      setPlans(data.data);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async (planId) => {
    alert("Payment gateway is not yet implemented. Upgrades will be available soon.");
  // if (planId === currentPlan) return;
  // setUpgrading(planId);
  // setMessage(null);
  // try {
  //   const { data } = await api.post("/subscription/upgrade", { plan: planId });
  //   setMessage({ type: "success", text: data.message });
  //   fetchBalance();
  //   const updated = { ...user, subscription: planId };
  //   localStorage.setItem("user", JSON.stringify(updated));
  //   useAuthStore.setState({ user: updated });
  // } catch (err) {
  //   setMessage({ type: "error", text: err.response?.data?.message || "Upgrade failed." });
  // } finally { setUpgrading(null); }
};

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const { data } = await api.post("/subscription/redeem", { code: promoCode });
      setRedeemMsg({ type: "success", text: data.message });
      setPromoCode("");
      fetchBalance();
    } catch (err) {
      setRedeemMsg({ type: "error", text: err.response?.data?.message || "Failed to redeem." });
    } finally { setRedeeming(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5" }}>

      {/* Header */}
      <div style={{
        padding: "0 24px", height: 56, display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.07)", gap: 16,
      }}>
        <button
          onClick={() => navigate("/chat")}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: "none",
            border: "none", cursor: "pointer", color: "#52525b", fontSize: 13, padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#a1a1aa"}
          onMouseLeave={e => e.currentTarget.style.color = "#52525b"}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: "#27272a" }}>·</span>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: "#e4e4e7" }}>Subscription</h1>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Choose your plan
          </h2>
          <p style={{ fontSize: 15, color: "#71717a" }}>
            Current plan:{" "}
            <span style={{ color: "#fff", fontWeight: 600, textTransform: "capitalize" }}>
              {currentPlan}
            </span>
          </p>
        </div>

        {message && (
          <div style={{
            marginBottom: 24, padding: "12px 16px", borderRadius: 10, fontSize: 14,
            background: message.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${message.type === "success" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: message.type === "success" ? "#4ade80" : "#f87171",
          }}>
            {message.text}
          </div>
        )}

        {/* Plans */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spinner size={28} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 48 }}>
            {plans.map(plan => {
              const isCurrent = currentPlan === plan.id;
              const colors = PLAN_COLORS[plan.id];
              const isDowngrade =
                (currentPlan === "enterprise" && (plan.id === "free" || plan.id === "pro")) ||
                (currentPlan === "pro" && plan.id === "free");

              return (
                <div
                  key={plan.id}
                  style={{
                    position: "relative", display: "flex", flexDirection: "column",
                    padding: 24, borderRadius: 20,
                    background: isCurrent ? colors.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isCurrent ? colors.border : "rgba(255,255,255,0.08)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  {isCurrent && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: colors.accent, color: "#000",
                    }}>
                      Current Plan
                    </div>
                  )}

                  {/* Plan header */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: isCurrent ? colors.bg : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isCurrent ? colors.border : "rgba(255,255,255,0.1)"}`,
                      }}>
                        <Zap size={15} style={{ color: isCurrent ? colors.accent : "#52525b" }} />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{plan.label}</span>
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                      {plan.price}
                    </p>
                    <p style={{ fontSize: 13, color: "#71717a" }}>
                      {plan.credits.toLocaleString()} credits/month
                    </p>
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", flex: 1, marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#a1a1aa" }}>
                        <Check size={14} style={{ color: isCurrent ? colors.accent : "#3f3f46", flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                  onClick={() => {
                    if (isCurrent || isDowngrade) return;
                    handleUpgrade(plan.id);
                  }}
                  disabled={isCurrent || isDowngrade || upgrading === plan.id}
                  style={{
                    width: "100%", padding: "11px", borderRadius: 12, border: "none",
                    fontSize: 14, fontWeight: 600,
                    cursor: isCurrent || isDowngrade ? "default" : "pointer",
                    background: isCurrent ? "rgba(255,255,255,0.06)" : isDowngrade ? "rgba(255,255,255,0.03)" : "#ffffff",
                    color: isCurrent ? "#71717a" : isDowngrade ? "#3f3f46" : "#000",
                    transition: "all 0.15s",
                  }}
                >
                  {upgrading === plan.id ? <Spinner size={14} />
                    : isCurrent ? "Current Plan"
                    : isDowngrade ? "Downgrade"
                    : `Upgrade to ${plan.label}`}
                </button>

                </div>
              );
            })}
              
          </div>
          
        )}
        <div style={{
                textAlign: "center", padding: "20px 24px", borderRadius: 16, marginBottom: 32,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <p style={{ fontSize: 14, color: "#71717a", marginBottom: 6 }}>
                  💳 Payment Gateway — Coming Soon
                </p>
                <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6 }}>
                  Secure online payments via Stripe are currently in development. Plans are available for testing — upgrades are applied immediately with no charge.
                </p>
        </div>
        {/* Redeem */}
        <div style={{
          padding: 24, borderRadius: 20,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Redeem Promo Code
          </h3>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
            Have a promo code? Get bonus credits instantly.
          </p>

          {redeemMsg && (
            <div style={{
              marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13,
              background: redeemMsg.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${redeemMsg.type === "success" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
              color: redeemMsg.type === "success" ? "#4ade80" : "#f87171",
            }}>
              {redeemMsg.text}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleRedeem()}
              placeholder="NEXORA100"
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 12, fontSize: 14,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", outline: "none", fontFamily: "monospace", letterSpacing: "0.08em",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.25)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <button
              onClick={handleRedeem}
              disabled={redeeming || !promoCode.trim()}
              style={{
                padding: "11px 24px", borderRadius: 12, border: "none",
                background: promoCode.trim() ? "#fff" : "rgba(255,255,255,0.07)",
                color: promoCode.trim() ? "#000" : "#52525b",
                fontWeight: 700, fontSize: 14, cursor: promoCode.trim() ? "pointer" : "not-allowed",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {redeeming ? <Spinner size={14} /> : "Redeem"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 10 }}>
            Try: NEXORA100 · NEXORA500 · WELCOME200 · DEVTEST999 · LAUNCH50
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#27272a", marginTop: 32 }}>
          Demo project · No real payments processed · Stripe-ready for production
        </p>
      </div>
    </div>
  );
};

export default Subscription;