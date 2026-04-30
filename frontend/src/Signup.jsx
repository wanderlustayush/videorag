import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth"
import { auth, googleProvider } from "./firebase"

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password) return
    setLoading(true)
    setError("")
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      // Save display name if provided
      if (name) {
        await updateProfile(userCredential.user, { displayName: name })
      }
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists")
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters")
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else {
        setError("Sign up failed. Please try again.")
      }
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError("")
    try {
      await signInWithPopup(auth, googleProvider)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError("Google sign in failed")
    }
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
    }}>

      {/* LEFT SIDE */}
      <div style={{
        width: "50%",
        height: "100%",
        background: "#0B0B0C",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "32px 24px",
      }}>

        <div style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}>

          {/* LOGO */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, #C15F3C, #a84e2e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 0 16px rgba(193,95,60,0.3)"
            }}>🎬</div>
            <span style={{
              fontFamily: "'Noto Serif Display', serif",
              fontSize: 22, fontWeight: 700,
              letterSpacing: "-0.03em", color: "#fff"
            }}>VideoRAG</span>
          </div>

          {/* HEADING */}
          <h1 style={{
            fontFamily: "'Noto Serif Display', serif",
            fontSize: "clamp(36px, 4vw, 56px)",
            lineHeight: 1,
            fontWeight: 500,
            margin: "0 0 8px 0",
            color: "#fff"
          }}>
            Create your<br />account
          </h1>

          <p style={{ color: "#aaa", fontSize: 15, marginBottom: 24 }}>
            Join to start <span style={{ color: "#fff" }}>Smart Learning</span>
          </p>

          {/* CARD */}
          <div style={{
            border: "1px solid #222",
            borderRadius: 20,
            padding: "22px 28px",
            width: "100%",
            background: "#111",
            boxSizing: "border-box",
          }}>

            {/* GOOGLE */}
            <button onClick={handleGoogle} style={{
              width: "100%", padding: "11px 16px",
              borderRadius: 10, border: "1px solid #333",
              background: "#1a1a1a", color: "#fff",
              marginBottom: 16, cursor: "pointer",
              fontSize: 14, display: "flex",
              alignItems: "center", justifyContent: "center", gap: 10
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ textAlign: "center", color: "#555", marginBottom: 6, fontSize: 13 }}>OR</div>

            {/* Name field */}
            {/* <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: 10, border: "1px solid #2a2a2a",
                background: "#0B0B0C", color: "#fff",
                marginBottom: 10, fontSize: 14,
                outline: "none", boxSizing: "border-box"
              }}
            /> */}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: 10, border: "1px solid #2a2a2a",
                background: "#0B0B0C", color: "#fff",
                marginBottom: 10, fontSize: 14,
                outline: "none", boxSizing: "border-box"
              }}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: 10, border: "1px solid #2a2a2a",
                background: "#0B0B0C", color: "#fff",
                marginBottom: 14, fontSize: 14,
                outline: "none", boxSizing: "border-box"
              }}
            />

            {error && (
              <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 10 }}>{error}</p>
            )}

            <button
              onClick={handleSignup}
              disabled={loading}
              style={{
                width: "100%", padding: "11px 16px",
                borderRadius: 10, border: "none",
                background: "#E5E5E5", color: "#000",
                fontFamily: "'Noto Serif Display', serif", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                fontSize: 17, opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p style={{ marginTop: 14, fontSize: 13, color: "#666", textAlign: "center" }}>
              Already have an account?{" "}
              <span onClick={() => navigate("/login")} style={{ color: "#fff", cursor: "pointer" }}>
                Sign in
              </span>
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{
        width: "50%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#F4F3EC",
        backgroundImage: "radial-gradient(circle, #ccc 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 80px)",
          height: "calc(100% - 80px)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
        }}>
          <video
            src="/video.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      </div>

    </div>
  )
}
