import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare, Code, Image, FileText, ScanText,
  ArrowRight, Check, Zap, Globe, Brain, Mic, Shield, ChevronDown,
} from "lucide-react";

const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const Counter = ({ target, suffix = "", inView }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <>{count}{suffix}</>;
};

const FEATURES = [
  { icon: MessageSquare, title: "AI Chat", desc: "Persistent conversations with memory. Chat, think deeply, or search the web in real time.", tags: ["GPT-level", "Web Search", "Think Mode"], color: "#60a5fa", wide: true },
  { icon: Code, title: "Code Workspace", desc: "Full VS Code-like editor with AI that reads your files and applies code with one click.", tags: ["Monaco Editor", "AI Apply", "ZIP Export"], color: "#4ade80", wide: false },
  { icon: Image, title: "Image Generation", desc: "Generate stunning images in any ratio directly inside your chat.", tags: ["Flux Model", "HD Quality"], color: "#fb923c", wide: false },
  { icon: FileText, title: "Document Analysis", desc: "Upload PDFs and documents. Summarize, extract key points, and ask questions.", tags: ["PDF", "DOC", "TXT"], color: "#a78bfa", wide: false },
  { icon: ScanText, title: "Image to Text", desc: "Describe images, extract text (OCR), detect objects, and analyze handwriting.", tags: ["OCR", "Vision"], color: "#f472b6", wide: false },
  { icon: Mic, title: "Voice Input", desc: "Speak your message and let AI transcribe and respond instantly.", tags: ["Web Speech API"], color: "#34d399", wide: false },
];

const STEPS = [
  { num: "01", title: "Create your account", desc: "Sign up in seconds. Get 100 free credits instantly with no credit card required." },
  { num: "02", title: "Start a conversation", desc: "Open a new chat and start with any AI tool — text, code, image, document, or voice." },
  { num: "03", title: "Get instant results", desc: "Nexora AI responds with rich markdown, code blocks, images, and live web results." },
];

const PLANS = [
  { name: "Free", price: "$0", credits: "100 credits/month", features: ["All AI tools", "2 code projects", "Chat history", "Basic support"] },
  { name: "Pro", price: "$9", credits: "1,000 credits/month", features: ["All AI tools", "10 code projects", "Priority support", "Faster responses"], highlighted: true },
  { name: "Enterprise", price: "$29", credits: "10,000 credits/month", features: ["All AI tools", "Unlimited projects", "Dedicated support", "API access"] },
];

const PHRASES = ["Chat with AI", "Generate Code", "Create Images", "Analyze Docs", "Search the Web"];

const Landing = () => {
  const [heroRef, heroInView] = useInView(0.1);
  const [featRef, featInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.3);
  const [stepsRef, stepsInView] = useInView(0.1);
  const [pricingRef, pricingInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.2);

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    if (typing) {
      if (displayed.length < phrase.length) {
        const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
        return () => clearTimeout(t);
      } else {
        setPhraseIdx(i => (i + 1) % PHRASES.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, phraseIdx]);

  return (
    <div style={{ background: "#0a0a0a", color: "#f5f5f5", overflowX: "hidden", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        @keyframes blobMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.08)} 66%{transform:translate(-30px,25px) scale(0.94)} }
        @keyframes blobMove2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,30px) scale(1.1)} 66%{transform:translate(35px,-40px) scale(0.9)} }
        @keyframes blobMove3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,25px) scale(1.05)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideLeft { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .ai { animation: fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .al { animation: fadeSlideLeft 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .cursor-blink { animation: cursorBlink 1s ease infinite; }
        html { scroll-behavior: smooth; }
        .nav-link { font-size:14px;color:#71717a;text-decoration:none;transition:color 0.15s; }
        .nav-link:hover { color:#e4e4e7; }
        .feat-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:26px;transition:all 0.25s;cursor:default; }
        .feat-card:hover { background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12);transform:translateY(-2px); }
        .step-card { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:26px;transition:all 0.25s; }
        .step-card:hover { background:rgba(255,255,255,0.04); }
        .plan-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:26px;display:flex;flex-direction:column;transition:all 0.25s; }
        .plan-card.hi { background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.2); }

        /* ── RESPONSIVE ── */
        .hero-grid { display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center; }
        .feat-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:14px; }
        .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:24px; }
        .steps-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:18px;position:relative; }
        .plans-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
        .feat-wide { grid-column:span 2; }
        .hide-mob { display:flex; }
        .show-mob { display:none; }

        @media (max-width:900px) {
          .hero-grid { grid-template-columns:1fr;gap:40px; }
          .hero-preview { display:none!important; }
          .feat-grid { grid-template-columns:1fr 1fr; }
          .feat-wide { grid-column:span 2; }
          .stats-grid { grid-template-columns:1fr 1fr; }
          .steps-grid { grid-template-columns:1fr; }
          .plans-grid { grid-template-columns:1fr; }
        }
        @media (max-width:600px) {
          .feat-grid { grid-template-columns:1fr; }
          .feat-wide { grid-column:span 1; }
          .hide-mob { display:none!important; }
          .show-mob { display:flex; }
          .hero-title { font-size:36px!important; }
          .hero-sub { font-size:36px!important; }
          .section-pad { padding:64px 20px!important; }
          .hero-pad { padding:48px 20px!important; }
          .hero-cta { flex-direction:column; }
          .stats-grid { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(10,10,10,0.88)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"0 20px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <Link to="/" style={{ display:"flex",alignItems:"center",gap:9,textDecoration:"none" }}>
            <div style={{ width:28,height:28,background:"#fff",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontSize:12,fontWeight:900,color:"#000" }}>N</span>
            </div>
            <span style={{ fontSize:14,fontWeight:700,color:"#fff" }}>Nexora AI</span>
          </Link>
          <div className="hide-mob" style={{ alignItems:"center",gap:28 }}>
            {["#features","#how-it-works","#pricing"].map((h,i) => (
              <a key={h} href={h} className="nav-link">{["Features","How it works","Pricing"][i]}</a>
            ))}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <Link to="/login" className="hide-mob nav-link" style={{ padding:"6px 12px" }}>Sign in</Link>
            <Link to="/register" style={{ fontSize:13,fontWeight:700,color:"#000",background:"#fff",textDecoration:"none",padding:"7px 16px",borderRadius:8,whiteSpace:"nowrap",transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#e4e4e4"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{ minHeight:"100vh",display:"flex",alignItems:"center",position:"relative",overflow:"hidden",paddingTop:80 }}>
        <div style={{ position:"absolute",inset:0,zIndex:0,overflow:"hidden" }}>
          <div style={{ position:"absolute",width:600,height:600,background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)",top:"5%",left:"5%",borderRadius:"50%",animation:"blobMove 12s ease-in-out infinite" }} />
          <div style={{ position:"absolute",width:500,height:500,background:"radial-gradient(circle,rgba(168,85,247,0.15) 0%,transparent 70%)",top:"30%",right:"10%",borderRadius:"50%",animation:"blobMove2 16s ease-in-out infinite" }} />
          <div style={{ position:"absolute",width:400,height:400,background:"radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)",bottom:"10%",left:"35%",borderRadius:"50%",animation:"blobMove3 20s ease-in-out infinite" }} />
          <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)",backgroundSize:"60px 60px" }} />
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"28%",background:"linear-gradient(to bottom,transparent,#0a0a0a)" }} />
        </div>

        <div className="hero-pad" style={{ maxWidth:1100,margin:"0 auto",padding:"72px 20px",position:"relative",zIndex:1,width:"100%" }}>
          <div className="hero-grid">
            {/* Left */}
            <div>
              <div className={heroInView?"ai":""} style={{ animationDelay:"0.05s",display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:999,padding:"5px 14px",marginBottom:22 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:"#4ade80",animation:"cursorBlink 1.5s ease infinite" }} />
                <span style={{ fontSize:12,color:"#a1a1aa",fontWeight:500 }}>Powered by Google Gemini</span>
              </div>

              {/* ── TYPING HEADLINE — nowrap fix ── */}
              <h1 className={`hero-title ${heroInView?"ai":""}`} style={{ fontSize:"clamp(34px,5vw,60px)",fontWeight:900,lineHeight:1.08,letterSpacing:"-0.03em",color:"#fff",marginBottom:6,animationDelay:"0.1s" }}>
                The AI workspace
              </h1>
              <div className={`hero-sub ${heroInView?"ai":""}`} style={{ fontSize:"clamp(34px,5vw,60px)",fontWeight:900,lineHeight:1.08,letterSpacing:"-0.03em",marginBottom:22,animationDelay:"0.16s",display:"flex",alignItems:"baseline",flexWrap:"nowrap",gap:0 }}>
                <span style={{ background:"linear-gradient(135deg,#e4e4e7 0%,#71717a 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap" }}>for&nbsp;</span>
                {/* Fixed: min-width prevents wrapping */}
                <span style={{ display:"inline-flex",alignItems:"baseline",minWidth:"clamp(180px,40vw,360px)",whiteSpace:"nowrap" }}>
                  <span style={{ background:"linear-gradient(135deg,#a78bfa,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
                    {displayed}
                  </span>
                  <span className="cursor-blink" style={{ WebkitTextFillColor:"#a78bfa",fontSize:"0.95em" }}>|</span>
                </span>
              </div>

              <p className={heroInView?"ai":""} style={{ fontSize:"clamp(15px,2vw,18px)",color:"#71717a",lineHeight:1.7,maxWidth:460,marginBottom:32,animationDelay:"0.22s" }}>
                One unified workspace for chat, code, images, documents, and voice. Persistent history, web search, deep thinking mode.
              </p>

              <div className={`hero-cta ${heroInView?"ai":""}`} style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:32,animationDelay:"0.28s" }}>
                <Link to="/register" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#fff",color:"#000",fontWeight:700,fontSize:14,padding:"12px 26px",borderRadius:12,textDecoration:"none",transition:"all 0.15s",whiteSpace:"nowrap" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#e4e4e4";e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.transform="none";}}>
                  Start for free <ArrowRight size={15} />
                </Link>
                <a href="#features" style={{ display:"inline-flex",alignItems:"center",gap:8,border:"1px solid rgba(255,255,255,0.12)",color:"#a1a1aa",fontWeight:600,fontSize:14,padding:"12px 22px",borderRadius:12,textDecoration:"none",transition:"all 0.15s",whiteSpace:"nowrap" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.22)";e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.color="#a1a1aa";}}>
                  See features
                </a>
              </div>

              <div className={heroInView?"ai":""} style={{ display:"flex",gap:20,flexWrap:"wrap",animationDelay:"0.34s" }}>
                {["No credit card","100 free credits","Cancel anytime"].map(t=>(
                  <div key={t} style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#52525b" }}>
                    <Check size={13} style={{ color:"#4ade80" }} />{t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — preview card (hidden on mobile) */}
            <div className={`hero-preview al ${heroInView?"al":""}`} style={{ animationDelay:"0.18s" }}>
              <div style={{ background:"rgba(17,17,17,0.92)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>
                <div style={{ background:"#1a1a1a",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ display:"flex",gap:5 }}>
                    {["#f87171","#fbbf24","#4ade80"].map(c=>(<div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c }} />))}
                  </div>
                  <div style={{ flex:1,background:"#111",borderRadius:5,padding:"3px 10px" }}>
                    <span style={{ fontSize:11,color:"#52525b" }}>nexora-v2.vercel.app</span>
                  </div>
                </div>
                <div style={{ padding:20,display:"flex",flexDirection:"column",gap:14 }}>
                  {[
                    { role:"user",text:"Explain async/await in JavaScript" },
                    { role:"ai",text:"Async/await makes asynchronous code look synchronous. The `async` keyword marks a function, and `await` pauses until a Promise resolves — no more callback hell." },
                  ].map((msg,i)=>(
                    <div key={i} style={{ display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8 }}>
                      {msg.role==="ai"&&<div style={{ width:18,height:18,background:"#fff",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}><span style={{ fontSize:7,fontWeight:900,color:"#000" }}>N</span></div>}
                      <div style={{ maxWidth:"80%",padding:"9px 13px",background:msg.role==="user"?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",fontSize:13,color:msg.role==="user"?"#e4e4e7":"#a1a1aa",lineHeight:1.6 }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div style={{ display:"flex",gap:6,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    {[{l:"Normal",a:true},{l:"Think",c:"#a78bfa"},{l:"Search",c:"#60a5fa"},{l:"Image",c:"#fb923c"}].map(m=>(
                      <div key={m.l} style={{ padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,background:m.a?"rgba(255,255,255,0.1)":"transparent",color:m.a?"#fff":(m.c||"#52525b") }}>{m.l}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign:"center",marginTop:52 }}>
            <a href="#features" style={{ display:"inline-flex",flexDirection:"column",alignItems:"center",gap:7,color:"#3f3f46",textDecoration:"none" }}>
              <span style={{ fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase" }}>Explore</span>
              <ChevronDown size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} style={{ borderTop:"1px solid rgba(255,255,255,0.07)",borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.015)" }}>
        <div className="stats-grid section-pad" style={{ maxWidth:1100,margin:"0 auto",padding:"44px 20px" }}>
          {[{value:15,suffix:"+",label:"AI Tools"},{value:5,suffix:"",label:"AI Modes"},{value:100,suffix:"",label:"Free Credits"},{value:20,suffix:"+",label:"Languages"}].map(s=>(
            <div key={s.label} style={{ textAlign:"center",padding:"12px 0" }}>
              <p style={{ fontSize:38,fontWeight:900,color:"#fff",lineHeight:1,marginBottom:7 }}>
                <Counter target={s.value} suffix={s.suffix} inView={statsInView} />
              </p>
              <p style={{ fontSize:13,color:"#52525b" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
     <section
  id="features"
  ref={featRef}
  className="section-pad"
  style={{
    padding: "100px 20px",
    maxWidth: 1180,
    margin: "0 auto",
  }}
>
  {/* Section Header */}
  <div
    className={featInView ? "ai" : ""}
    style={{
      textAlign: "center",
      marginBottom: 58,
    }}
  >
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#71717a",
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        marginBottom: 15,
      }}
    >
      Everything you need
    </p>

    <h2
      style={{
        fontSize: "clamp(28px, 4vw, 44px)",
        fontWeight: 800,
        color: "#fff",
        lineHeight: 1.08,
        letterSpacing: "-0.035em",
        marginBottom: 16,
      }}
    >
      One platform.
      <br />
      <span
        style={{
          color: "#52525b",
          fontWeight: 300,
        }}
      >
        Every AI capability.
      </span>
    </h2>

    <p
      style={{
        fontSize: 15,
        color: "#71717a",
        maxWidth: 500,
        margin: "0 auto",
        lineHeight: 1.7,
      }}
    >
      No more jumping between tools. Nexora AI brings everything into one
      seamless workspace.
    </p>
  </div>

  {/* Feature Grid */}
  <div className="feat-grid">
    {FEATURES.map((f, i) => {
      const Icon = f.icon;

      return (
        <div
          key={f.title}
          className={`feat-card ${featInView ? "ai" : ""}`}
          style={{
            animationDelay: `${0.07 * i}s`,
          }}
        >
          {/* Top glow */}
          <div
            className="feat-card-glow"
            style={{
              background: `radial-gradient(
                circle at 20% 0%,
                ${f.color}18 0%,
                transparent 55%
              )`,
            }}
          />

          {/* Icon */}
          <div
            className="feat-icon"
            style={{
              background: `linear-gradient(
                135deg,
                ${f.color}18,
                ${f.color}08
              )`,
              border: `1px solid ${f.color}30`,
              boxShadow: `0 0 0 1px ${f.color}08 inset`,
            }}
          >
            <Icon
              size={19}
              strokeWidth={1.8}
              style={{ color: f.color }}
            />
          </div>

          {/* Content */}
          <div className="feat-content">
            <h3>{f.title}</h3>

            <p>{f.desc}</p>

            <div className="feat-tags">
              {f.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    color: f.color,
                    background: `${f.color}0d`,
                    border: `1px solid ${f.color}20`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom shine */}
          <div
            className="feat-card-line"
            style={{
              background: `linear-gradient(
                90deg,
                transparent,
                ${f.color}45,
                transparent
              )`,
            }}
          />
        </div>
      );
    })}
  </div>
</section>

      {/* ── How it works ── */}
      <section id="how-it-works" ref={stepsRef} className="section-pad" style={{ padding:"88px 20px",background:"rgba(255,255,255,0.015)",borderTop:"1px solid rgba(255,255,255,0.07)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className={stepsInView?"ai":""} style={{ textAlign:"center",marginBottom:56 }}>
            <p style={{ fontSize:11,fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14 }}>Simple by design</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,42px)",fontWeight:800,color:"#fff",lineHeight:1.15 }}>Up and running in minutes</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((step,i)=>(
              <div key={step.num} className={`step-card ${stepsInView?"ai":""}`} style={{ animationDelay:`${0.1*i}s` }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18 }}>
                  <span style={{ fontSize:44,fontWeight:900,lineHeight:1,color:"#1f1f1f" }}>{step.num}</span>
                  <div style={{ width:30,height:30,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:4 }}>
                    <Check size={15} style={{ color:"#000" }} />
                  </div>
                </div>
                <h3 style={{ fontSize:16,fontWeight:700,color:"#fff",marginBottom:8 }}>{step.title}</h3>
                <p style={{ fontSize:13,color:"#71717a",lineHeight:1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" ref={pricingRef} className="section-pad" style={{ padding:"88px 20px" }}>
        <div style={{ maxWidth:960,margin:"0 auto" }}>
          <div className={pricingInView?"ai":""} style={{ textAlign:"center",marginBottom:56 }}>
            <p style={{ fontSize:11,fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14 }}>Pricing</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,42px)",fontWeight:800,color:"#fff",lineHeight:1.15,marginBottom:14 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize:15,color:"#71717a" }}>Start free. Upgrade when you need more.</p>
          </div>
          <div className="plans-grid">
            {PLANS.map((plan,i)=>(
              <div key={plan.name} className={`plan-card ${plan.highlighted?"hi":""} ${pricingInView?"ai":""}`} style={{ animationDelay:`${0.1*i}s`,position:"relative" }}>
                {plan.highlighted&&<div style={{ position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#fff",color:"#000",fontSize:10,fontWeight:800,padding:"3px 14px",borderRadius:999,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap" }}>Most Popular</div>}
                <div style={{ marginBottom:18 }}>
                  <h3 style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:8 }}>{plan.name}</h3>
                  <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:5 }}>
                    <span style={{ fontSize:36,fontWeight:900,color:"#fff" }}>{plan.price}</span>
                    <span style={{ fontSize:13,color:"#52525b" }}>/month</span>
                  </div>
                  <p style={{ fontSize:13,color:"#71717a" }}>{plan.credits}</p>
                </div>
                <ul style={{ listStyle:"none",flex:1,marginBottom:22,display:"flex",flexDirection:"column",gap:9 }}>
                  {plan.features.map(f=>(
                    <li key={f} style={{ display:"flex",alignItems:"center",gap:9,fontSize:13,color:"#a1a1aa" }}>
                      <Check size={13} style={{ color:plan.highlighted?"#fff":"#52525b",flexShrink:0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" style={{ display:"block",textAlign:"center",padding:"11px",borderRadius:10,textDecoration:"none",fontWeight:700,fontSize:13,background:plan.highlighted?"#fff":"rgba(255,255,255,0.07)",color:plan.highlighted?"#000":"#a1a1aa",border:plan.highlighted?"none":"1px solid rgba(255,255,255,0.1)",transition:"all 0.15s" }}
                  onMouseEnter={e=>{if(!plan.highlighted){e.currentTarget.style.background="rgba(255,255,255,0.12)";e.currentTarget.style.color="#fff";}}}
                  onMouseLeave={e=>{if(!plan.highlighted){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="#a1a1aa";}}}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security badges ── */}
      <section style={{ padding:"72px 20px",borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:40 }}>
          {[
            { icon:Shield,label:"JWT + OAuth Auth",desc:"Secure dual authentication" },
            { icon:Zap,label:"2FA Verification",desc:"Email OTP on every login" },
            { icon:Globe,label:"Live Web Search",desc:"Real-time Google results" },
            { icon:Brain,label:"Deep Thinking",desc:"Gemini 3.6 reasoning mode" },
          ].map(item=>{
            const Icon=item.icon;
            return (
              <div key={item.label} style={{ textAlign:"center" }}>
                <div style={{ width:46,height:46,borderRadius:13,margin:"0 auto 11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icon size={19} style={{ color:"#71717a" }} />
                </div>
                <p style={{ fontSize:13,fontWeight:600,color:"#e4e4e7",marginBottom:3 }}>{item.label}</p>
                <p style={{ fontSize:12,color:"#52525b" }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} style={{ padding:"88px 20px 72px" }}>
        <div style={{ maxWidth:580,margin:"0 auto",textAlign:"center" }}>
          <div className={ctaInView?"ai":""}>
            <h2 style={{ fontSize:"clamp(30px,5vw,50px)",fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:14,letterSpacing:"-0.02em" }}>Start building with AI.</h2>
            <h2 style={{ fontSize:"clamp(30px,5vw,50px)",fontWeight:200,color:"#3f3f46",lineHeight:1.1,marginBottom:24,letterSpacing:"-0.02em" }}>Free forever.</h2>
            <p style={{ fontSize:15,color:"#71717a",lineHeight:1.7,marginBottom:32 }}>Join developers and creators using Nexora AI to move faster and build smarter.</p>
            <Link to="/register" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#fff",color:"#000",fontWeight:700,fontSize:14,padding:"13px 30px",borderRadius:14,textDecoration:"none",transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 20px 40px rgba(255,255,255,0.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              Get started for free <ArrowRight size={15} />
            </Link>
            <p style={{ fontSize:12,color:"#3f3f46",marginTop:14 }}>100 credits free every month · No credit card</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.07)",padding:"28px 20px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:22,height:22,background:"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontSize:9,fontWeight:900,color:"#000" }}>N</span>
            </div>
            <span style={{ fontSize:13,color:"#52525b" }}>Nexora AI V2</span>
          </div>
          <p style={{ fontSize:12,color:"#3f3f46" }}>Built with MERN Stack · Powered by Gemini AI</p>
          <div style={{ display:"flex",gap:18 }}>
            <Link to="/login" style={{ fontSize:12,color:"#52525b",textDecoration:"none" }}>Sign in</Link>
            <Link to="/register" style={{ fontSize:12,color:"#52525b",textDecoration:"none" }}>Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;