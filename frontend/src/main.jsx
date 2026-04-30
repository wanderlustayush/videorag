import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import Landing from "./Landing"
import Login from "./Login"
import Signup from "./Signup"
import Dashboard from "./Dashboard"
import "./index.css"

// ── Shows nothing while Firebase checks auth state ──
function AuthWrapper({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still checking

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  if (user === undefined) {
    // Still loading — show a blank screen instead of flashing login
    return null
  }

  return children(user)
}

// ── Only accessible when logged OUT (login, signup) ──
// If already logged in → redirect to dashboard
function PublicRoute({ user, children }) {
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// ── Only accessible when logged IN (dashboard) ──
// If not logged in → redirect to login
function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthWrapper>
        {(user) => (
          <Routes>
            {/* Landing — if already logged in, skip straight to dashboard */}
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
            />

            <Route path="/login" element={
              <PublicRoute user={user}>
                <Login />
              </PublicRoute>
            } />

            <Route path="/signup" element={
              <PublicRoute user={user}>
                <Signup />
              </PublicRoute>
            } />

            <Route path="/dashboard" element={
              <PrivateRoute user={user}>
                <Dashboard />
              </PrivateRoute>
            } />
          </Routes>
        )}
      </AuthWrapper>
    </BrowserRouter>
  </StrictMode>
)
