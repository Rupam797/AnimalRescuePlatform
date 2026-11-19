import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { adoptionService } from "../services/api";
import { Heart, AlertCircle, ArrowRight } from "lucide-react";

export default function MyAdoptionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const res = await adoptionService.getMyRequests();
        setRequests(res.data);
      } catch (err) {
        setError("Failed to load your adoption requests.");
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return { text: "APPROVED", bg: "#dcfce7", color: "#166534", border: "#86efac" };
      case "REJECTED":
        return { text: "NOT SELECTED", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
      default:
        return { text: "UNDER REVIEW", bg: "#fef9ee", color: "#b45309", border: "#fde68a" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "900px", margin: "32px auto 48px", padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#263b31", margin: 0 }}>My Adoption Applications</h1>
            <p style={{ fontSize: "13px", color: "#5d7367", marginTop: "3px" }}>
              Track the review and approval progress of your pet adoption applications
            </p>
          </div>
          <Link
            to="/adoptions"
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              background: "#1b7a43",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>Browse More Pets</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertCircle size={15} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="status-spinner" style={{ margin: "0 auto 12px" }}></div>
            <p style={{ color: "#61776b", fontSize: "14px" }}>Loading your applications...</p>
          </div>
        ) : requests.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "48px 20px",
              textAlign: "center",
              border: "1px solid #e2ebe4",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={24} color="#1b7a43" />
              </div>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#263b31", margin: 0 }}>
              No Adoption Applications Yet
            </h3>
            <p style={{ color: "#61776b", fontSize: "13px", maxWidth: "400px", margin: "6px auto 18px" }}>
              Explore our gallery of rescued animals and apply to give one of them a loving forever home!
            </p>
            <Link
              to="/adoptions"
              style={{
                display: "inline-block",
                padding: "10px 18px",
                borderRadius: "8px",
                background: "#1b7a43",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              Browse Adoptable Pets
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {requests.map((req) => {
              const badge = getStatusBadge(req.status);
              const animal = req.animal;

              return (
                <div
                  key={req.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid #e1ece3",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "10px",
                      background: "#eef2ef",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={animal?.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80"}
                      alt={animal?.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#263b31", margin: 0 }}>
                          Application for {animal?.name}
                        </h3>
                        <div style={{ fontSize: "12px", color: "#6c8376" }}>
                          {animal?.species} &middot; {animal?.breed || animal?.species}
                        </div>
                      </div>

                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#f9faf9",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#475e51",
                        margin: "8px 0",
                        border: "1px solid #edf2ee",
                      }}
                    >
                      "{req.message}"
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a9d92" }}>
                      <span>Submitted on {new Date(req.createdAt).toLocaleDateString()}</span>
                      <span>Contact: {req.phone}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
