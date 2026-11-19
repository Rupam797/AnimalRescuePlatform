import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { PawPrint, AlertCircle, Shield, Ambulance, User } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "ROLE_ADMIN") {
        navigate("/admin");
      } else if (user.role === "ROLE_VOLUNTEER") {
        navigate("/volunteer");
      } else {
        navigate(from === "/login" ? "/my-reports" : from);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "440px", margin: "40px auto", padding: "0 16px" }}>
        <div
          style={{
            background: "#ffffff",
            padding: "32px 28px",
            borderRadius: "14px",
            border: "1px solid #e2ebe4",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#e8f5ec",
                color: "#1b7a43",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
                border: "1px solid #c9e4d1",
              }}
            >
              <PawPrint size={22} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#263b31", margin: 0 }}>
              Account Sign In
            </h1>
            <p style={{ fontSize: "13px", color: "#6c8376", marginTop: "4px" }}>
              Sign in to rescue animals, manage cases, or adopt
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#263b31",
                  marginBottom: "5px",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d4dfd7",
                  fontSize: "14px",
                  color: "#263b31",
                  background: "#ffffff",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#263b31" }}>Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d4dfd7",
                  fontSize: "14px",
                  color: "#263b31",
                  background: "#ffffff",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "8px",
                background: "#1b7a43",
                color: "#ffffff",
                border: "1px solid #1b7a43",
                fontSize: "14px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #edf2ee" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#7a9184",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              Quick Demo Fill
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@pawrescue.org", "Admin@123")}
                style={{
                  padding: "8px 4px",
                  borderRadius: "6px",
                  border: "1px solid #d2e4d8",
                  background: "#f5fbf7",
                  color: "#1b7a43",
                  fontSize: "11px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Shield size={12} />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("rahul.volunteer@pawrescue.org", "Volunteer@123")}
                style={{
                  padding: "8px 4px",
                  borderRadius: "6px",
                  border: "1px solid #fae2c5",
                  background: "#fffaf4",
                  color: "#c27803",
                  fontSize: "11px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Ambulance size={12} />
                <span>Volunteer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("ananya.citizen@gmail.com", "User@123")}
                style={{
                  padding: "8px 4px",
                  borderRadius: "6px",
                  border: "1px solid #e1dcf2",
                  background: "#faf8ff",
                  color: "#6b46c1",
                  fontSize: "11px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <User size={12} />
                <span>Citizen</span>
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#5d7367" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#1b7a43", fontWeight: "700", textDecoration: "none" }}>
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
