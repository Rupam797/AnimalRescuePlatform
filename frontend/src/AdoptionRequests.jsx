import { useEffect, useState } from "react";
import "./AdoptionRequests.css";
import { adoptionService } from "./services/api";
import { Heart, Check, X, CheckCircle2, AlertCircle } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function AdoptionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adoptionService.getAllRequests();
      setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load adoption requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleStatus(id, newStatus) {
    try {
      setUpdatingId(id);
      setError("");
      setMessage("");

      await adoptionService.updateRequestStatus(id, { status: newStatus });
      setMessage(
        newStatus === "APPROVED"
          ? `Application approved! The animal is now marked ADOPTED and conflicting requests were updated.`
          : `Application was marked ${newStatus}.`
      );
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update request status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return { text: "APPROVED", bg: "#dcfce7", color: "#166534", border: "#86efac" };
      case "REJECTED":
        return { text: "REJECTED", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
      default:
        return { text: "PENDING", bg: "#fef9ee", color: "#b45309", border: "#fde68a" };
    }
  };

  return (
    <section className="adoption-requests-page">
      <div className="adoption-requests-header">
        <div>
          <div className="adoption-requests-eyebrow">PAWRESCUE ADOPTIONS</div>
          <h1>Adoption Applications</h1>
          <p>Review family adoption applications, approve suitable homes, and manage animal rehoming.</p>
        </div>
        <span className="adoption-requests-total">{requests.length} applications</span>
      </div>

      {message && (
        <div className="adoption-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="adoption-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      <div className="adoption-requests-card">
        {loading ? (
          <div className="state-empty">Loading adoption applications...</div>
        ) : requests.length === 0 ? (
          <div className="state-empty">No adoption requests received yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="adoption-requests-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Animal</th>
                  <th>Applicant</th>
                  <th>Contact Info</th>
                  <th>Applicant Message</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const isPending = req.status === "PENDING";

                  return (
                    <tr key={req.id}>
                      <td>
                        <strong>#APP-{String(req.id).padStart(4, "0")}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#e8f5ec", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Heart size={14} color="#1b7a43" />
                          </div>
                          <div>
                            <div style={{ fontWeight: "700" }}>{req.animal?.name || "Animal"}</div>
                            <div style={{ fontSize: "11px", color: "#61776b" }}>{req.animal?.species}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{req.user?.name}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px" }}>{req.user?.email}</div>
                        <div style={{ fontSize: "12px", color: "#1b7a43", fontWeight: "600" }}>{req.phone}</div>
                      </td>
                      <td style={{ maxWidth: "260px" }}>
                        <div style={{ fontSize: "12px", color: "#475e51", lineHeight: 1.4 }}>
                          "{req.message}"
                        </div>
                      </td>
                      <td>{formatDate(req.createdAt)}</td>
                      <td>
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
                      </td>
                      <td>
                        {isPending ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              disabled={updatingId === req.id}
                              onClick={() => handleStatus(req.id, "APPROVED")}
                              style={{
                                background: "#1b7a43",
                                color: "#ffffff",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === req.id}
                              onClick={() => handleStatus(req.id, "REJECTED")}
                              style={{
                                background: "#fef2f2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                padding: "5px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#8a9d92" }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
