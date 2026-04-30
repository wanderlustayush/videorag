import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [typed, setTyped] = useState("")
  const [qIndex, setQIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const questions = [
    "What did the professor explain at 12:34?",
    "Summarize the key points of this lecture",
    "What was said about neural networks?",
    "Explain the concept at timestamp 5:20",
    "What are the main takeaways?",
  ]

  const floatingIcons = [
    { icon: "📹", top: "18%", left: "7%", size: 56, delay: "0s", dur: "6s", anim: "fi1" },
    { icon: "▶️", top: "22%", right: "7%", size: 50, delay: "1s", dur: "7s", anim: "fi2" },
    { icon: "🎬", bottom: "30%", left: "5%", size: 48, delay: "0.5s", dur: "8s", anim: "fi3" },
    { icon: "📱", bottom: "25%", right: "6%", size: 52, delay: "1.5s", dur: "5s", anim: "fi1" },
    { icon: "🎞️", top: "14%", left: "28%", size: 38, delay: "2s", dur: "9s", anim: "fi2" },
    { icon: "📡", top: "12%", right: "26%", size: 36, delay: "0.8s", dur: "7s", anim: "fi3" },
    { icon: "🎤", bottom: "18%", left: "25%", size: 34, delay: "1.2s", dur: "6s", anim: "fi1" },
    { icon: "🔴", bottom: "14%", right: "24%", size: 32, delay: "0.3s", dur: "8s", anim: "fi2" },
  ]

const features = [
  { icon: "⏱", title: "Timestamped Answers", desc: "Every answer links to the exact moment in the video — click to jump straight there, no scrubbing required." },
  { icon: "🎙", title: "Ask in Plain English", desc: "No commands or syntax needed. Just type your question and get a precise, context-aware answer instantly." },
  { icon: "📹", title: "YouTube & File Support", desc: "Paste any YouTube URL or upload an MP4, MOV, or AVI — VideoRAG handles both without any extra setup." },
  { icon: "🧠", title: "Understands Full Context", desc: "Answers are generated from the actual transcript of your video, not guesses — so you always get accurate responses." },
  { icon: "⚡", title: "Lightning Fast Responses", desc: "Get answers in seconds, not minutes. No waiting around while your video is being processed again and again." },
  { icon: "🔒", title: "Private & Secure", desc: "Your videos and questions are tied to your account only. Nothing is shared or stored beyond your session." },
]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouse)
    return () => { window.removeEventListener("scroll", handleScroll); window.removeEventListener("mousemove", handleMouse) }
  }, [])

  useEffect(() => {
    const current = questions[qIndex]
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIndex < current.length) {
          setTyped(current.slice(0, charIndex + 1))
          setCharIndex(c => c + 1)
        } else {
          setTimeout(() => setDeleting(true), 2000)
        }
      } else {
        if (charIndex > 0) {
          setTyped(current.slice(0, charIndex - 1))
          setCharIndex(c => c - 1)
        } else {
          setDeleting(false)
          setQIndex(i => (i + 1) % questions.length)
        }
      }
    }, deleting ? 25 : 55)
    return () => clearTimeout(timeout)
  }, [charIndex, deleting, qIndex])

  return (
    <div style={{ background: "#FAF9F5", minHeight: "100vh", color: "#1F1E1D", fontFamily: "'Segoe UI', -apple-system, sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap');
        @keyframes fi1 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-16px) rotate(4deg)} }
        @keyframes fi2 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-4deg)} }
        @keyframes fi3 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(3deg)} }
        @keyframes bgDrift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-15px)} }
        @keyframes bgDrift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,20px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes logoPulse { 0%,100%{box-shadow:0 0 16px rgba(193,95,60,0.3)} 50%{box-shadow:0 0 28px rgba(193,95,60,0.5)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #FAF9F5; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(193,95,60,0.04), transparent 45%)`, transition: "background 0.05s" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(31,30,29,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 48px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(250,249,245,0.92)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid rgba(31,30,29,0.08)" : "none", transition: "all 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 16px rgba(193,95,60,0.3)", animation: "logoPulse 3s ease-in-out infinite" }}>🎬</div>
          <span style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#1F1E1D" }}>VideoRAG</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* <button onClick={() => navigate("/login")} style={{ padding: "7px 20px", borderRadius: 8, border: "1px solid rgba(31,30,29,0.12)", background: "transparent", color: "#6b6b6b", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#1F1E1D"; e.currentTarget.style.borderColor = "rgba(31,30,29,0.25)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6b6b6b"; e.currentTarget.style.borderColor = "rgba(31,30,29,0.12)" }}
          >Sign in</button> */}
          {/* <button onClick={() => navigate("/signup")} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #C15F3C, #a84e2e)", color: "#FAF9F5", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 0 20px rgba(193,95,60,0.3)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 30px rgba(193,95,60,0.5)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(193,95,60,0.3)"}
          >Get started</button> */}
        </div>
      </nav>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", zIndex: 1, overflow: "hidden" }}>

        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(193,95,60,0.05) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "20%", width: 300, height: 300, background: "radial-gradient(circle, rgba(193,95,60,0.04) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "bgDrift1 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 250, height: 250, background: "radial-gradient(circle, rgba(168,78,46,0.04) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "bgDrift2 12s ease-in-out infinite" }} />

        {floatingIcons.map((item, i) => (
          <div key={i} style={{
            position: "absolute", top: item.top, bottom: item.bottom, left: item.left, right: item.right,
            width: item.size + 20, height: item.size + 20,
            background: "rgba(250,249,245,0.85)",
            border: "1px solid rgba(193,95,60,0.15)",
            borderRadius: 18, backdropFilter: "blur(12px)",
            animation: `${item.anim} ${item.dur} ${item.delay} ease-in-out infinite`,
            boxShadow: "0 8px 32px rgba(31,30,29,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          }} />
        ))}

        {floatingIcons.map((item, i) => (
          <div key={`icon-${i}`} style={{
            position: "absolute", top: item.top, bottom: item.bottom, left: item.left, right: item.right,
            width: item.size + 20, height: item.size + 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: item.size * 0.5,
            animation: `${item.anim} ${item.dur} ${item.delay} ease-in-out infinite`,
            pointerEvents: "none",
          }}>{item.icon}</div>
        ))}

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720 }}>

          <h1 style={{ lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 22, animation: "fadeUp 0.8s ease both" }}>
            <span style={{ display: "block", fontFamily: "'Cedarville Cursive', cursive", fontWeight: 400, fontSize: "clamp(38px, 5.5vw, 68px)", color: "#C15F3C", marginBottom: 8 }}>
              Ask Anything About
            </span>
            <span style={{ display: "block", fontFamily: "'Segoe UI', -apple-system, sans-serif", fontWeight: 800, fontSize: "clamp(52px, 8vw, 96px)", letterSpacing: "-0.04em", color: "#1F1E1D" }}>
              Any Video
            </span>
          </h1>

         <p style={{ fontSize: 17, color: "#6b6b6b", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7, fontWeight: 400, letterSpacing: "-0.01em", animation: "fadeUp 0.8s 0.1s ease both" }}>
  Upload a lecture, paste a YouTube link — get{" "}
  <span style={{ fontSize: 20,fontFamily: "'Noto Serif Display', serif", fontWeight: 600 }}>
    AI answers
  </span>{" "}
  with exact timestamps.
</p>

          <div style={{ animation: "fadeUp 0.8s 0.2s ease both", marginBottom: 36 }}>
            <div style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(193,95,60,0.15)", borderRadius: 12, padding: "14px 22px", display: "inline-flex", alignItems: "center", gap: 10, minWidth: 380, maxWidth: "90vw", boxShadow: "0 4px 24px rgba(31,30,29,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
              <span style={{ color: "#aaa", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>Try asking:</span>
              <span style={{ color: "#C15F3C", fontSize: 14, fontStyle: "italic", flex: 1, textAlign: "left" }}>{typed}</span>
              <span style={{ width: 1.5, height: 17, background: "#C15F3C", display: "inline-block", flexShrink: 0, animation: "blink 1.1s step-end infinite" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.8s 0.3s ease both" }}>
            <button onClick={() => navigate("/signup")}
              style={{ padding: "13px 30px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #C15F3C, #a84e2e)", color: "#FAF9F5", cursor: "pointer", fontFamily: "'Noto Serif Display', serif",fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em", boxShadow: "0 0 40px rgba(193,95,60,0.25)", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 56px rgba(193,95,60,0.4)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(193,95,60,0.25)" }}
            >Start for free →</button>
            <button onClick={() => navigate("/login")}
              style={{ padding: "13px 30px", borderRadius: 10, border: "1px solid rgba(31,30,29,0.12)", background: "rgba(255,255,255,0.6)", color: "#6b6b6b", cursor: "pointer", fontFamily: "'Noto Serif Display', serif",fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#1F1E1D"; e.currentTarget.style.borderColor = "rgba(31,30,29,0.25)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6b6b6b"; e.currentTarget.style.borderColor = "rgba(31,30,29,0.12)" }}
            >Sign in</button>
          </div>

          <div style={{ display: "flex", gap: 44, justifyContent: "center", marginTop: 56, flexWrap: "wrap", animation: "fadeUp 0.8s 0.4s ease both" }}>
            {[["Any video", "YouTube or upload"], ["Timestamped", "Exact moments"], ["RAG powered", "Accurate answers"], ["100% free", "No credit card"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Noto Serif Display', serif",fontSize: 19, fontWeight: 600, color: "#0c0c0b", marginBottom: 4, letterSpacing: "-0.02em" }}>{val}</div>
                <div style={{ fontFamily: "'Noto Serif Display', serif",fontSize: 15, color: "#6c6464" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "100px 24px", maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontFamily: "'Noto Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, color: "#1F1E1D" }}>Stop watching Start understanding</h2>
          <p style={{ color: "#6b6b6b",fontFamily: "'Noto Serif Display', serif", fontSize: 18 }}>Ask questions. Get answers. Jump to the moment.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {features.map((f) => (
            <div key={f.title}
              style={{ background: "#fff", border: "1px solid rgba(31,30,29,0.08)", borderRadius: 16, padding: "28px 24px", transition: "all 0.3s ease", cursor: "default", boxShadow: "0 2px 12px rgba(31,30,29,0.04)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(193,95,60,0.2)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(31,30,29,0.08)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(31,30,29,0.08)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,30,29,0.04)" }}
            >
              <div style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 35, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{fontFamily: "'Noto Serif Display', serif", fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#1F1E1D", letterSpacing: "-0.02em" }}>{f.title}</h3>
              <p style={{ color: "#6b6b6b", fontFamily: "'Noto Serif Display', serif", fontSize: 15, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "100px 24px 120px", textAlign: "center", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%, rgba(193,95,60,0.05) 0%, transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "clamp(32px, 5.5vw, 60px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 16, color: "#1F1E1D", lineHeight: 1.05 }}>
            Try it now.{" "}
            <span style={{ color: "#C15F3C" }}>It's free.</span>
          </h2>
          <p style={{ color: "#6b6b6b", fontSize: 16, marginBottom: 40 }}>No credit card required. Start asking in seconds.</p>
          <button onClick={() => navigate("/signup")}
            style={{ padding: "15px 48px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #C15F3C, #a84e2e)", color: "#FAF9F5", cursor: "pointer", fontFamily: "'Noto Serif Display', serif",fontSize: 18, fontWeight: 500, boxShadow: "0 0 60px rgba(193,95,60,0.25)", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 0 80px rgba(193,95,60,0.4)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(193,95,60,0.25)" }}
          >Create free account →</button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(31,30,29,0.08)", padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎬</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#aaa" }}>VideoRAG</span>
        </div>
        <p style={{ color: "#aaa", fontSize: 12 }}>React · FastAPI · Whisper · ChromaDB · Groq · Firebase</p>
      </div>

    </div>
  )
}