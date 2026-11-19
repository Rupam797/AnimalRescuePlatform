import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { adoptionService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Heart,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";

export default function AdoptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [submitting, setSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  useEffect(() => {
    async function loadAnimal() {
      try {
        setLoading(true);
        const res = await adoptionService.getById(id);
        setAnimal(res.data);
      } catch (err) {
        setError("Animal not found or no longer available.");
      } finally {
        setLoading(false);
      }
    }

    loadAnimal();
  }, [id]);

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: { pathname: `/adoptions/${id}` },
          notice: "Please log in to submit an adoption application.",
        },
      });
      return;
    }
    setShowModal(true);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await adoptionService.requestAdoption(id, {
        message: message.trim(),
        phone: phone.trim(),
      });
      setApplicationSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit adoption application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "980px", margin: "28px auto 48px", padding: "0 16px" }}>
        <Link
          to="/adoptions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: "#1b7a43",
            fontWeight: "700",
            fontSize: "13px",
            textDecoration: "none",
            marginBottom: "18px",
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to All Adoptable Pets</span>
        </Link>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div className="status-spinner" style={{ margin: "0 auto 12px" }}></div>
            <p style={{ color: "#61776b", fontSize: "14px" }}>Loading pet details...</p>
          </div>
        ) : error || !animal ? (
          <div style={{ background: "#ffffff", padding: "40px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2ebe4" }}>
            <p style={{ color: "#c81e1e", margin: 0 }}>{error || "Animal details not found."}</p>
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #e1ece3",
              boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            {/* Left: Photo */}
            <div style={{ background: "#eef3ef", minHeight: "340px", position: "relative" }}>
              <img
                src={animal.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80"}
                alt={animal.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  background: animal.status === "AVAILABLE" ? "#1b7a43" : "#d97706",
                  color: "#ffffff",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                {animal.status === "AVAILABLE" ? "AVAILABLE FOR ADOPTION" : animal.status}
              </div>
            </div>

            {/* Right: Details & Action */}
            <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#263b31", margin: "0 0 4px" }}>
                  {animal.name}
                </h1>
                <div style={{ fontSize: "14px", color: "#6c8376", marginBottom: "18px" }}>
                  {animal.breed || animal.species} &middot; {animal.species}
                </div>
              </div>

              {/* Quick specs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ background: "#f5f9f6", padding: "10px 6px", borderRadius: "8px", border: "1px solid #e4efe7" }}>
                  <div style={{ fontSize: "10px", color: "#61776b", fontWeight: "700" }}>AGE</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#263b31", marginTop: "2px" }}>
                    {animal.age || "Young"}
                  </div>
                </div>

                <div style={{ background: "#f5f9f6", padding: "10px 6px", borderRadius: "8px", border: "1px solid #e4efe7" }}>
                  <div style={{ fontSize: "10px", color: "#61776b", fontWeight: "700" }}>GENDER</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#263b31", marginTop: "2px" }}>
                    {animal.gender || "Unknown"}
                  </div>
                </div>

                <div style={{ background: "#f5f9f6", padding: "10px 6px", borderRadius: "8px", border: "1px solid #e4efe7" }}>
                  <div style={{ fontSize: "10px", color: "#61776b", fontWeight: "700" }}>STATUS</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#1b7a43", marginTop: "2px" }}>
                    {animal.status}
                  </div>
                </div>
              </div>

              {/* Health notes */}
              {animal.healthNotes && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "4px" }}>
                    Veterinary & Health Record
                  </div>
                  <div
                    style={{
                      background: "#eef8f1",
                      color: "#166534",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "1px solid #cce9d6",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Check size={14} flexShrink={0} />
                    <span>{animal.healthNotes}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: "24px", flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "4px" }}>
                  About {animal.name}
                </div>
                <p style={{ fontSize: "13px", color: "#475e51", lineHeight: 1.6, margin: 0 }}>
                  {animal.description || "A very sweet and gentle companion looking for a lifelong home."}
                </p>
              </div>

              {/* Apply Button */}
              {animal.status === "AVAILABLE" ? (
                <button
                  type="button"
                  onClick={handleOpenModal}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#1b7a43",
                    color: "#ffffff",
                    border: "1px solid #1b7a43",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Heart size={16} />
                  <span>Apply to Adopt {animal.name}</span>
                </button>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#fef3c7",
                    color: "#92400e",
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: "13px",
                    border: "1px solid #fde68a",
                  }}
                >
                  This animal has found a home ({animal.status})
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Adoption Request Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: "480px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: 0 }}>
                Adoption Application: {animal.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {applicationSuccess ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#e8f5ec", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={28} color="#1b7a43" />
                  </div>
                </div>
                <h4 style={{ fontSize: "17px", fontWeight: "700", color: "#1b7a43", margin: "0 0 6px" }}>
                  Application Submitted
                </h4>
                <p style={{ fontSize: "13px", color: "#5d7367", lineHeight: 1.5, marginBottom: "18px" }}>
                  Your application to adopt {animal.name} has been sent to our rescue administrators. They will review it
                  and contact you at {phone}.
                </p>
                <Link
                  to="/my-requests"
                  style={{
                    display: "inline-block",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "#1b7a43",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "13px",
                  }}
                >
                  View My Applications
                </Link>
              </div>
            ) : (
              <form onSubmit={handleApply}>
                <p style={{ fontSize: "13px", color: "#5d7367", marginBottom: "14px", lineHeight: 1.4 }}>
                  Tell us about yourself, your living arrangement, and why you would love to adopt {animal.name}.
                </p>

                {error && (
                  <div style={{ background: "#fef2f2", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} flexShrink={0} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#263b31", marginBottom: "5px" }}>
                    Your Message / Home Environment <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Living in an apartment with a nearby park, experience with rescued pets, work remotely..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d4dfd7",
                      fontSize: "13px",
                      color: "#263b31",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#263b31", marginBottom: "5px" }}>
                    Contact Phone Number <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d4dfd7",
                      fontSize: "13px",
                      color: "#263b31",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d4dfd7",
                      background: "#ffffff",
                      color: "#475e51",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: "#1b7a43",
                      color: "#ffffff",
                      border: "1px solid #1b7a43",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Send size={13} />
                    <span>{submitting ? "Submitting..." : "Send Application"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
