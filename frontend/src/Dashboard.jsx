import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import ReactPlayer from "react-player"
import axios from "axios"

const toTime = (sec) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

const formatGroupLabel = (ts) => {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return "Previous 7 days"
  if (diffDays < 30) return "Previous 30 days"
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

const getHistoryKey = (uid) => `videorag_history_${uid}`
const loadHistory = (uid) => {
  if (!uid) return []
  try { return JSON.parse(localStorage.getItem(getHistoryKey(uid)) || "[]") } catch { return [] }
}
const saveHistory = (uid, h) => {
  if (!uid) return
  localStorage.setItem(getHistoryKey(uid), JSON.stringify(h))
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [videoId, setVideoId] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [ytEmbedId, setYtEmbedId] = useState(null)
  const [videoTitle, setVideoTitle] = useState("")
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [focusedField, setFocusedField] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hoveredHistId, setHoveredHistId] = useState(null)
  const [history, setHistory] = useState([])
  const [activeHistoryId, setActiveHistoryId] = useState(null)

  const player = useRef(null)
  const iframeRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login")
      } else {
        setUser((prev) => {
          if (prev && prev.uid !== u.uid) {
            setVideoId(null); setVideoUrl(null); setYtEmbedId(null)
            setVideoTitle(""); setMessages([]); setSources([])
            setActiveHistoryId(null); setUrlInput("")
          }
          return u
        })
        setHistory(loadHistory(u.uid))
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", h)
    return () => window.removeEventListener("mousemove", h)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {})
  }, [])

  const addToHistory = (vidId, title, url, ytId) => {
    const entry = { id: Date.now(), videoId: vidId, title, url, ytId: ytId || null, timestamp: Date.now(), messages: [] }
    const updated = [entry, ...history].slice(0, 60)
    setHistory(updated)
    saveHistory(user?.uid, updated)
    setActiveHistoryId(entry.id)
    return entry
  }

  const updateHistoryMessages = (histId, msgs) => {
    const updated = history.map(h => h.id === histId ? { ...h, messages: msgs } : h)
    setHistory(updated)
    saveHistory(user?.uid, updated)
  }

  const loadFromHistory = (entry) => {
    setVideoId(entry.videoId); setVideoUrl(entry.url)
    setYtEmbedId(entry.ytId); setVideoTitle(entry.title)
    setMessages(entry.messages || []); setSources([])
    setActiveHistoryId(entry.id)
  }

  const deleteHistory = (e, id) => {
    e.stopPropagation()
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    saveHistory(user?.uid, updated)
    if (activeHistoryId === id) {
      setVideoId(null); setVideoUrl(null); setYtEmbedId(null)
      setVideoTitle(""); setMessages([]); setSources([]); setActiveHistoryId(null)
    }
  }

  const startNew = () => {
    setVideoId(null); setVideoUrl(null); setYtEmbedId(null)
    setVideoTitle(""); setMessages([]); setSources([])
    setActiveHistoryId(null); setUrlInput("")
  }

  const pollStatus = (jobId, title, url, ytId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/status/${jobId}`)
        const data = await res.json()
        setProcessingStatus(data.status)
        if (data.status === "done") {
          clearInterval(interval)
          setVideoId(data.video_id)
          addToHistory(data.video_id, title, url, ytId)
          setProcessing(false)
          setProcessingStatus("")
        } else if (data.status === "error") {
          clearInterval(interval)
          setMessages([{ role: "ai", text: `Processing failed: ${data.message}` }])
          setVideoUrl(null); setVideoTitle("")
          setProcessing(false); setProcessingStatus("")
        }
      } catch {
        clearInterval(interval)
        setProcessing(false); setProcessingStatus("")
      }
    }, 5000)
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProcessing(true); setProcessingStatus("queued")
    await fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {})
    const url = URL.createObjectURL(file)
    setVideoUrl(url); setYtEmbedId(null); setMessages([]); setSources([])
    const title = file.name.replace(/\.[^/.]+$/, "")
    setVideoTitle(title)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, form, { timeout: 30000 })
      pollStatus(res.data.job_id, title, url, null)
    } catch (err) {
      console.error("Upload error:", err)
      setVideoUrl(null); setVideoTitle("")
      setProcessing(false); setProcessingStatus("")
    }
  }

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return
    setProcessing(true); setProcessingStatus("queued"); setMessages([]); setSources([])
    const match = urlInput.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    const ytId = match ? match[1] : null
    setYtEmbedId(ytId)
    const url = ytId ? `https://www.youtube.com/watch?v=${ytId}` : urlInput
    setVideoUrl(url)
    const title = ytId ? `YouTube · ${ytId}` : urlInput.slice(0, 48) + "..."
    setVideoTitle(title)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload-url`, { url: urlInput }, { timeout: 30000 })
      pollStatus(res.data.job_id, title, url, ytId)
    } catch (err) {
      console.error("URL upload error:", err)
      setVideoUrl(null); setYtEmbedId(null); setVideoTitle("")
      setProcessing(false); setProcessingStatus("")
    }
  }

  const handleAsk = async () => {
    if (!query.trim() || !videoId) return
    const userMsg = query.trim()
    setQuery(""); setLoading(true)
    const newMsgs = [...messages, { role: "user", text: userMsg }]
    setMessages(newMsgs)
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {})
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ask`, { query: userMsg, video_id: videoId }, { timeout: 60000 })
      const aiMsg = { role: "ai", text: res.data.answer, sources: res.data.sources }
      const finalMsgs = [...newMsgs, aiMsg]
      setMessages(finalMsgs); setSources(res.data.sources)
      if (activeHistoryId) updateHistoryMessages(activeHistoryId, finalMsgs)
    } catch {
      setMessages([...newMsgs, { role: "ai", text: "Something went wrong. Please try again." }])
    }
    setLoading(false)
  }

  const jumpToTime = (seconds) => {
    if (ytEmbedId && iframeRef.current) {
      iframeRef.current.src = `https://www.youtube.com/embed/${ytEmbedId}?start=${Math.floor(seconds)}&autoplay=1`
    } else if (player.current) {
      player.current.seekTo(seconds, "seconds")
    }
  }

  const grouped = history.reduce((acc, h) => {
    const label = formatGroupLabel(h.timestamp)
    if (!acc[label]) acc[label] = []
    acc[label].push(h)
    return acc
  }, {})

  const groupOrder = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days"]
  const sortedGroups = [
    ...groupOrder.filter(g => grouped[g]),
    ...Object.keys(grouped).filter(g => !groupOrder.includes(g))
  ]

  const floatingIcons = [
    { icon: "📹", top: "18%", left: "2%", size: 48, delay: "0s", dur: "6s", anim: "fi1" },
    { icon: "▶️", top: "35%", right: "2%", size: 44, delay: "1s", dur: "7s", anim: "fi2" },
    { icon: "🎬", bottom: "30%", left: "2%", size: 42, delay: "0.5s", dur: "8s", anim: "fi3" },
    { icon: "🎙", bottom: "20%", right: "2%", size: 40, delay: "1.5s", dur: "5s", anim: "fi1" },
    { icon: "⚡", top: "55%", left: "1.5%", size: 34, delay: "0.8s", dur: "7s", anim: "fi3" },
  ]

  return (
    <div style={{ height: "100vh", background: "#FAF9F5", color: "#1F1E1D", fontFamily: "'Segoe UI', -apple-system, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cedarville+Cursive&family=Noto+Serif+Display:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes logoPulse { 0%,100%{box-shadow:0 0 16px rgba(193,95,60,0.3)} 50%{box-shadow:0 0 28px rgba(193,95,60,0.5)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fi1 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-14px) rotate(4deg)} }
        @keyframes fi2 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-10px) rotate(-4deg)} }
        @keyframes fi3 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes thinking { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #FAF9F5; }
        textarea::placeholder { color: #bbb; }
        input::placeholder { color: #bbb; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(193,95,60,0.18); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(193,95,60,0.35); }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(193,95,60,0.04), transparent 45%)` }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(31,30,29,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px", zIndex: 0 }} />

      {!videoId && floatingIcons.map((item, i) => (
        <div key={i} style={{ position: "fixed", top: item.top, bottom: item.bottom, left: item.left, right: item.right, width: item.size + 20, height: item.size + 20, background: "rgba(250,249,245,0.85)", border: "1px solid rgba(193,95,60,0.12)", borderRadius: 16, backdropFilter: "blur(12px)", animation: `${item.anim} ${item.dur} ${item.delay} ease-in-out infinite`, boxShadow: "0 8px 32px rgba(31,30,29,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: item.size * 0.48, zIndex: 0, pointerEvents: "none" }}>{item.icon}</div>
      ))}

      <nav style={{ background: "rgba(250,249,245,0.92)", borderBottom: "1px solid rgba(31,30,29,0.08)", padding: "0 20px", height: 62, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(31,30,29,0.1)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#050505", fontSize: 19, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(193,95,60,0.06)"; e.currentTarget.style.borderColor = "rgba(193,95,60,0.2)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(31,30,29,0.1)" }}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: "logoPulse 3s ease-in-out infinite" }}>🎬</div>
            <span style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#1F1E1D" }}>VideoRAG</span>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "#fff", border: "1px solid rgba(31,30,29,0.08)", borderRadius: 12, padding: "7px 12px", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(193,95,60,0.25)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(31,30,29,0.08)"}
          >
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Serif Display', serif", fontSize: 14, fontWeight: 700, color: "#FAF9F5", flexShrink: 0 }}>
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 15, fontWeight: 500, color: "#1F1E1D" }}>{user?.displayName?.split(" ")[0] || "User"}</span>
            <span style={{ color: "#aaa", fontSize: 10, transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </div>
          {showDropdown && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", border: "1px solid rgba(31,30,29,0.08)", borderRadius: 14, padding: 6, minWidth: 220, zIndex: 200, boxShadow: "0 12px 40px rgba(31,30,29,0.12)", animation: "fadeIn 0.15s ease both" }}>
              <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(31,30,29,0.06)", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Serif Display', serif", fontSize: 18, fontWeight: 600, color: "#FAF9F5" }}>
                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 14, fontWeight: 600, color: "#1F1E1D" }}>{user?.displayName || "User"}</div>
                    <div style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 12, color: "#161414" }}>{user?.email}</div>
                  </div>
                </div>
              </div>
              <div onClick={async () => { await signOut(auth); navigate("/") }} style={{ padding: "9px 14px", borderRadius: 9, cursor: "pointer", color: "#c0392b", fontFamily: "'Noto Serif Display', serif", fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(192,57,43,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >Sign Out</div>
            </div>
          )}
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>

        <div style={{ width: sidebarOpen ? 256 : 0, flexShrink: 0, overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", borderRight: sidebarOpen ? "1px solid rgba(31,30,29,0.08)" : "none", background: "#FAF9F5", display: "flex", flexDirection: "column" }}>
          <div style={{ width: 256, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", padding: "14px 10px" }}>
            <button onClick={startNew} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px dashed rgba(193,95,60,0.3)", background: "transparent", color: "#060606", fontFamily: "'Noto Serif Display', serif", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 18, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(193,95,60,0.05)"; e.currentTarget.style.borderColor = "rgba(193,95,60,0.5)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(193,95,60,0.3)" }}
            >
              <span style={{ fontFamily: "'Noto Serif Display', serif", fontWeight: 900, color: "#0f0e0d", fontSize: 25 }}>💬</span> New Video
            </button>

            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 14px", color: "#ccc" }}>
                <div style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 30, marginBottom: 10, opacity: 0.5 }}>🎬</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, fontFamily: "'Noto Serif Display', serif" }}>Your video history will appear here</p>
              </div>
            ) : (
              sortedGroups.map(group => (
                <div key={group} style={{ marginBottom: 18 }}>
                  <p style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 15, fontWeight: 700, color: "#161515", textTransform: "uppercase", letterSpacing: "0.09em", padding: "0 8px", marginBottom: 5 }}>{group}</p>
                  {grouped[group].map(entry => (
                    <div key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      onMouseEnter={() => setHoveredHistId(entry.id)}
                      onMouseLeave={() => setHoveredHistId(null)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", borderRadius: 10, cursor: "pointer", marginBottom: 2, transition: "all 0.15s", background: activeHistoryId === entry.id ? "rgba(193,95,60,0.08)" : hoveredHistId === entry.id ? "rgba(31,30,29,0.04)" : "transparent", border: activeHistoryId === entry.id ? "1px solid rgba(193,95,60,0.18)" : "1px solid transparent" }}
                    >
                      <div style={{ width: 28, height: 32, borderRadius: 8, background: entry.ytId ? "rgba(255,0,0,0.08)" : "rgba(193,95,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {entry.ytId ? "▶️" : "📁"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <p style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 12, fontWeight: activeHistoryId === entry.id ? 600 : 500, color: activeHistoryId === entry.id ? "#9a4222" : "#010101", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>{entry.title}</p>
                        <p style={{ fontSize: 13, color: "#1e1919", marginTop: 0 }}>
                          {entry.messages?.length > 0 ? `${Math.floor(entry.messages.length / 2)} Q&A` : "No questions yet"}
                        </p>
                      </div>
                      {hoveredHistId === entry.id && (
                        <button onClick={(e) => deleteHistory(e, entry.id)} style={{ width: 20, height: 20, borderRadius: 6, border: "none", background: "rgba(192,57,43,0.08)", color: "#c0392b", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(192,57,43,0.2)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(192,57,43,0.08)"}
                          title="Remove"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ width: "50%", height: "100%", overflowY: "auto", padding: "18px 14px 18px 18px", borderRight: "1px solid rgba(31,30,29,0.07)", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          {!videoId && (
            <>
              <div style={{ background: "#fff", border: "1px solid rgba(31,30,29,0.08)", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 20px rgba(31,30,29,0.05)", display: "flex", minHeight: 210 }}>
                <div style={{ flex: 1, padding: 20, borderRight: "1px solid rgba(31,30,29,0.07)", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>📁</span>
                    <span style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 17, fontWeight: 700, color: "#1F1E1D" }}>Upload File</span>
                    <span style={{ fontSize: 10, color: "#aaa", background: "rgba(31,30,29,0.05)", padding: "2px 7px", borderRadius: 20 }}>MP4·MOV·AVI</span>
                  </div>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(193,95,60,0.2)", borderRadius: 12, padding: "18px 12px", cursor: "pointer", background: "rgba(193,95,60,0.01)", transition: "all 0.25s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(193,95,60,0.45)"; e.currentTarget.style.background = "rgba(193,95,60,0.04)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(193,95,60,0.2)"; e.currentTarget.style.background = "rgba(193,95,60,0.01)" }}
                  >
                    <div style={{ width: 45, height: 40, borderRadius: 10, background: "rgba(193,95,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, marginBottom: 8 }}>📁</div>
                    <span style={{ fontFamily: "'Noto Serif Display', serif", color: "#1F1E1D", fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Drop or click to browse</span>
                    <span style={{ fontFamily: "'Noto Serif Display', serif", color: "#aaa", fontSize: 11 }}>Up to 2GB</span>
                    <input type="file" accept="video/*" onChange={handleUpload} style={{ display: "none" }} />
                  </label>
                </div>

                <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>🔗</span>
                    <span style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 17, fontWeight: 700, color: "#1F1E1D" }}>YouTube / URL</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleUrlUpload()}
                      onFocus={() => setFocusedField("url")} onBlur={() => setFocusedField(null)}
                      placeholder="Paste YouTube or video URL..."
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${focusedField === "url" ? "rgba(193,95,60,0.5)" : "rgba(31,30,29,0.1)"}`, background: "#FAF9F5", color: "#1F1E1D", fontSize: 13, outline: "none", fontFamily: "'Noto Serif Display', serif", transition: "all 0.2s", boxShadow: focusedField === "url" ? "0 0 0 3px rgba(34, 32, 31, 0.07)" : "none" }}
                    />
                    <button onClick={handleUrlUpload} disabled={processing} style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #C15F3C, #a84e2e)", color: "#FAF9F5", border: "none", borderRadius: 10, cursor: processing ? "not-allowed" : "pointer", fontFamily: "'Noto Serif Display', serif", fontSize: 16, fontWeight: 600, opacity: processing ? 0.6 : 1, boxShadow: "0 0 16px rgba(193,95,60,0.2)", transition: "all 0.2s" }}>
                      {processing ? "⏳ Processing..." : "Load Video →"}
                    </button>
                  </div>
                </div>
              </div>

              {processing && (
                <div style={{ background: "rgba(193,95,60,0.04)", border: "1px solid rgba(193,95,60,0.15)", borderRadius: 11, padding: "10px 14px", display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 13, height: 13, border: "2px solid #C15F3C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontFamily: "'Noto Serif Display', serif", color: "#C15F3C", fontSize: 13, fontWeight: 500 }}>
                    {processingStatus === "transcribing" ? "Transcribing with Whisper... please wait" :
                     processingStatus === "embedding" ? "Storing in ChromaDB..." :
                     processingStatus === "downloading" ? "Downloading video..." :
                     "Processing... please wait"}
                  </span>
                </div>
              )}

              {!processing && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 48, opacity: 0.15 }}>🎬</span>
                  <p style={{ fontFamily: "'Noto Serif Display', serif", color: "#ccc", fontSize: 14 }}>Your video will appear here</p>
                </div>
              )}
            </>
          )}

          {videoId && (
            <>
              <div style={{ background: "rgba(34,139,34,0.04)", border: "1px solid rgba(34,139,34,0.15)", borderRadius: 11, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span>✅</span>
                <span style={{ fontFamily: "'Noto Serif Display', serif", color: "#2d7a2d", fontSize: 13, fontWeight: 500 }}>Video ready — Start Learning !</span>
              </div>

              {videoUrl && (
                <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(31,30,29,0.15)", flexShrink: 0 }}>
                  {ytEmbedId ? (
                    <iframe ref={iframeRef} src={`https://www.youtube.com/embed/${ytEmbedId}?autoplay=0`} width="100%" height="280" style={{ border: "none", display: "block" }} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  ) : (
                    <ReactPlayer ref={player} url={videoUrl} controls width="100%" height="280px" />
                  )}
                </div>
              )}

              {sources.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid rgba(31,30,29,0.08)", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(31,30,29,0.04)" }}>
                  <p style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>📍 Sources — click to jump</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sources.map((s, i) => (
                      <div key={i} onClick={() => jumpToTime(s.start)}
                        style={{ background: "#FAF9F5", border: "1px solid rgba(31,30,29,0.07)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(193,95,60,0.3)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(31,30,29,0.07)"; e.currentTarget.style.transform = "translateY(0)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ color: "#C15F3C", fontSize: 10 }}>▶</span>
                          <span style={{ background: "rgba(193,95,60,0.08)", color: "#C15F3C", fontFamily: "'Noto Serif Display', serif", fontSize: 12, padding: "1px 8px", borderRadius: 20, fontWeight: 600 }}>
                            {toTime(s.start)} – {toTime(s.end)}
                          </span>
                        </div>
                        <p style={{ color: "#6b6b6b", fontSize: 13, lineHeight: 1.6 }}>{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", background: "#FAF9F5" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 10px", display: "flex", flexDirection: "column", gap: 0 }}>
            {messages.length === 0 && !loading && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "40px 24px", textAlign: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: 15, background: "#F4F3EE", border: "1.5px solid rgba(193,95,60,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(193,95,60,0.1)" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.37 17.06L2.07 21.93L6.94 20.63C8.42 21.5 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#C15F3C" opacity="0.15"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.37 17.06L2.07 21.93L6.94 20.63C8.42 21.5 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#C15F3C" strokeWidth="1.5" fill="none"/>
                    <path d="M8 10.5H16M8 13.5H13" stroke="#C15F3C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Noto Serif Display', serif", fontSize: 20, fontWeight: 500, color: "#1F1E1D", marginBottom: 5, letterSpacing: "-0.02em" }}>Ask anything about your video</h3>
                  <p style={{ fontFamily: "'Noto Serif Display', serif", color: "#aaa", fontSize: 14 }}>{videoId ? "Video is ready! Type your question below." : "Load a video first, then ask away."}</p>
                </div>
                {videoId && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 4 }}>
                    {["Summarize this video", "What are the key points?", "Who is speaking?", "What topics are covered?"].map(s => (
                      <button key={s} onClick={() => setQuery(s)} style={{ padding: "7px 13px", borderRadius: 20, border: "1px solid rgba(193,95,60,0.2)", background: "rgba(193,95,60,0.04)", color: "#C15F3C", fontFamily: "'Segoe UI', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(193,95,60,0.1)"; e.currentTarget.style.borderColor = "rgba(193,95,60,0.4)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(193,95,60,0.04)"; e.currentTarget.style.borderColor = "rgba(193,95,60,0.2)" }}
                      >{s}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16, animation: "fadeIn 0.3s ease both" }}>
                {msg.role === "ai" && (
                  <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #e6511b, #ae8874)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginRight: 10, marginTop: 2, boxShadow: "0 4px 12px rgba(193,95,60,0.2)" }}>💬</div>
                )}
                <div style={{ maxWidth: "76%" }}>
                  <div style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #C15F3C, #a84e2e)" : "#fff", color: msg.role === "user" ? "#FAF9F5" : "#1F1E1D", fontSize: 14, lineHeight: 1.75, boxShadow: msg.role === "user" ? "0 4px 20px rgba(50,45,43,0.22)" : "0 2px 10px rgba(31,30,29,0.06)", border: msg.role === "ai" ? "1px solid rgba(31,30,29,0.07)" : "none", fontFamily: msg.role === "ai" ? "'Noto Serif Display', serif" : "'Segoe UI', sans-serif" }}>
                    {msg.text}
                  </div>
                  {msg.role === "ai" && msg.sources?.length > 0 && (
                    <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {msg.sources.map((s, j) => (
                        <button key={j} onClick={() => jumpToTime(s.start)} style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(193,95,60,0.07)", border: "1px solid rgba(193,95,60,0.15)", color: "#C15F3C", fontFamily: "'Noto Serif Display', serif", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(193,95,60,0.15)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(193,95,60,0.07)"}
                        >▶ {toTime(s.start)}</button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#FAF9F5", marginLeft: 10, marginTop: 2 }}>
                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16, animation: "fadeIn 0.3s ease both" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #C15F3C, #a84e2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginRight: 10 }}>🤖</div>
                <div style={{ padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "#fff", border: "1px solid rgba(31,30,29,0.07)", boxShadow: "0 2px 10px rgba(31,30,29,0.06)", display: "flex", alignItems: "center", gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C15F3C", opacity: 0.7, animation: `thinking 1.4s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: "10px 18px 14px", borderTop: "1px solid rgba(31,30,29,0.07)", background: "rgba(250,249,245,0.95)", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#fff", border: `1.5px solid ${focusedField === "chat" ? "rgba(193,95,60,0.4)" : "rgba(31,30,29,0.1)"}`, borderRadius: 15, padding: "9px 13px", boxShadow: focusedField === "chat" ? "0 0 0 3px rgba(193,95,60,0.07)" : "0 2px 10px rgba(31,30,29,0.06)", transition: "all 0.2s" }}>
              <textarea value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
                onFocus={() => setFocusedField("chat")} onBlur={() => setFocusedField(null)}
                placeholder={videoId ? "Ask anything about the video..." : "Load a video first..."}
                disabled={!videoId} rows={1}
                style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", color: "#1F1E1D", fontFamily: "'Segoe UI', -apple-system, sans-serif", fontSize: 14, lineHeight: 1.6, maxHeight: 120, overflow: "auto", padding: 0 }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px" }}
              />
              <button onClick={handleAsk} disabled={loading || !videoId || !query.trim()} style={{ width: 34, height: 34, borderRadius: 9, border: "none", flexShrink: 0, background: (!videoId || !query.trim() || loading) ? "rgba(31,30,29,0.08)" : "linear-gradient(135deg, #C15F3C, #a84e2e)", color: (!videoId || !query.trim() || loading) ? "#bbb" : "#fff", cursor: (!videoId || !query.trim() || loading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transition: "all 0.2s", boxShadow: (!videoId || !query.trim() || loading) ? "none" : "0 4px 14px rgba(193,95,60,0.3)" }}>↑</button>
            </div>
            <p style={{ textAlign: "center", fontFamily: "'Noto Serif Display', serif", color: "#ccc", fontSize: 11, marginTop: 6 }}>Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  )
}