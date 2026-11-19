import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { User, Ambulance, AlertCircle, CheckCircle2, Info, ArrowRight } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ROLE_USER");
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessNotice("");
    setLoading(true);

    try {
      const result = await signup({ name, email, phone, password, role });
      if (result.pending) {
        setSuccessNotice(
          "Your volunteer account has been submitted! An administrator will review and approve your registration before you can log in."
        );
      } else {
        navigate("/my-reports");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed. Please check your inputs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "480px", margin: "36px auto", padding: "0 16px" }}>
        <div
          style={{
            background: "#ffffff",
            padding: "32px 28px",
            borderRadius: "14px",
            border: "1px solid #e2ebe4",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#263b31", margin: 0 }}>Create an Account</h1>
            <p style={{ fontSize: "13px", color: "#6c8376", marginTop: "4px" }}>
              Join to report animals in distress or apply to adopt
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#fdf2f2",
                border: "1px solid #f8b4b4",
                color: "#c81e1e",
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

          {successNotice && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#166534",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "20px",
                lineHeight: "1.5",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                <CheckCircle2 size={18} color="#166534" flexShrink={0} style={{ marginTop: "1px" }} />
                <span>{successNotice}</span>
              </div>
              <div>
                <Link
                  to="/login"
                  style={{
                    color: "#166534",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none",
                  }}
                >
                  <span>Proceed to Login</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {!successNotice && (
            <form onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#263b31", marginBottom: "8px" }}>
                  I want to register as:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setRole("ROLE_USER")}
                    style={{
                      padding: "12px 10px",
                      borderRadius: "10px",
                      border: role === "ROLE_USER" ? "2px solid #1b7a43" : "1px solid #d4dfd7",
                      background: role === "ROLE_USER" ? "#e8f5ec" : "#ffffff",
                      color: "#263b31",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                      <User size={20} color={role === "ROLE_USER" ? "#1b7a43" : "#6c8376"} />
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "13px" }}>Citizen / Adopter</div>
                    <div style={{ fontSize: "11px", color: "#5d7367", marginTop: "2px" }}>Report animals & adopt</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ROLE_VOLUNTEER")}
                    style={{
                      padding: "12px 10px",
                      borderRadius: "10px",
                      border: role === "ROLE_VOLUNTEER" ? "2px solid #c27803" : "1px solid #d4dfd7",
                      background: role === "ROLE_VOLUNTEER" ? "#fef7ed" : "#ffffff",
                      color: "#263b31",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                      <Ambulance size={20} color={role === "ROLE_VOLUNTEER" ? "#c27803" : "#6c8376"} />
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "13px" }}>Rescue Volunteer</div>
                    <div style={{ fontSize: "11px", color: "#5d7367", marginTop: "2px" }}>Respond & treat cases</div>
                  </button>
                </div>

                {role === "ROLE_VOLUNTEER" && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px 12px",
                      background: "#fffaf0",
                      border: "1px solid #feebc8",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#744210",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Info size={14} flexShrink={0} />
                    <span>Volunteer accounts require admin review & approval before activation.</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#263b31", marginBottom: "5px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Sen"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "14px",
                    color: "#263b31",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#263b31", marginBottom: "5px" }}>
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
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#263b31", marginBottom: "5px" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "14px",
                    color: "#263b31",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#263b31", marginBottom: "5px" }}>
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
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
                {loading ? "Creating account..." : "Complete registration"}
              </button>
            </form>
          )}

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#5d7367" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#1b7a43", fontWeight: "700", textDecoration: "none" }}>
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
