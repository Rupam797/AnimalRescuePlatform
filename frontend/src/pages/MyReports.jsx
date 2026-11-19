import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { reportService, BACKEND_URL } from "../services/api";
import MapView from "../components/MapView";
import {
  PawPrint,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  Shield,
  Plus,
} from "lucide-react";

const LIFECYCLE_STEPS = [
  { key: "REPORTED", label: "Reported" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "RESCUED", label: "Rescued" },
  { key: "UNDER_TREATMENT", label: "Treatment" },
  { key: "RECOVERED", label: "Recovered" },
  { key: "LISTED_FOR_ADOPTION", label: "Listed" },
  { key: "ADOPTED", label: "Adopted" },
];

function getStepIndex(status) {
  const index = LIFECYCLE_STEPS.findIndex((s) => s.key === status);
  return index !== -1 ? index : 0;
}

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const location = useLocation();
  const successMessage = location.state?.successMessage;

  useEffect(() => {
    async function loadMyReports() {
      try {
        setLoading(true);
        const res = await reportService.getMyReports();
        setReports(res.data);
        if (res.data.length > 0) {
          setSelectedReport(res.data[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your reports.");
      } finally {
        setLoading(false);
      }
    }

    loadMyReports();
  }, []);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "REPORTED":
        return { bg: "#fef9ee", color: "#b45309", border: "#fde68a" };
      case "ASSIGNED":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
      case "RESCUED":
        return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
      case "UNDER_TREATMENT":
        return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" };
      case "RECOVERED":
        return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
      case "LISTED_FOR_ADOPTION":
        return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
      case "ADOPTED":
        return { bg: "#dcfce7", color: "#166534", border: "#86efac" };
      case "CANCELLED":
      case "NOT_FOUND":
        return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
      default:
        return { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "1140px", margin: "28px auto 48px", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#263b31", margin: 0 }}>My Reported Animals</h1>
            <p style={{ fontSize: "13px", color: "#5d7367", marginTop: "3px" }}>
              Track rescue responses, medical treatment progress, and recovery milestones
            </p>
          </div>
          <Link
            to="/report"
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              background: "#1b7a43",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={15} />
            <span>Report Another Animal</span>
          </Link>
        </div>

        {successMessage && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} flexShrink={0} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="status-spinner" style={{ margin: "0 auto 12px" }}></div>
            <p style={{ color: "#61776b", fontSize: "14px" }}>Loading your rescue reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "48px 20px",
              textAlign: "center",
              border: "1px solid #e2ebe4",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PawPrint size={28} color="#1b7a43" />
              </div>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#263b31", margin: "0 0 6px" }}>
              No Reports Filed Yet
            </h3>
            <p style={{ color: "#61776b", fontSize: "13px", maxWidth: "420px", margin: "0 auto 18px" }}>
              When you spot an injured animal, report it here so volunteers can respond and provide medical care.
            </p>
            <Link
              to="/report"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "8px",
                background: "#1b7a43",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              <Plus size={15} />
              <span>Report Injured Animal</span>
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {/* Left Column: Report List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                const badge = getStatusBadgeStyle(report.status);
                const firstImg = report.images && report.images.length > 0 ? getImageUrl(report.images[0]) : null;

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "14px",
                      border: isSelected ? "2px solid #1b7a43" : "1px solid #e1ece3",
                      cursor: "pointer",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "10px",
                        background: "#eef3ef",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {firstImg ? (
                        <img src={firstImg} alt={report.animalName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          <PawPrint size={22} color="#94a3b8" />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#263b31" }}>
                          {report.animalName || `Injured ${report.animalType}`}
                        </div>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {report.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#61776b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={12} flexShrink={0} />
                        <span>{report.address || `${report.latitude}, ${report.longitude}`}</span>
                      </div>

                      <div style={{ fontSize: "11px", color: "#8a9d92", marginTop: "3px" }}>
                        Reported {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Detailed Tracker with Status Timeline */}
            {selectedReport && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "24px",
                  border: "1px solid #e1ece3",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#1b7a43", letterSpacing: "0.5px" }}>
                      CASE #AR-{String(selectedReport.id).padStart(4, "0")}
                    </div>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                      {selectedReport.animalName}
                    </h2>
                    <div style={{ fontSize: "12px", color: "#5d7367", marginTop: "2px" }}>
                      {selectedReport.animalType} &middot; Severity: <b>{selectedReport.severity}</b>
                    </div>
                  </div>

                  <span
                    style={{
                      ...getStatusBadgeStyle(selectedReport.status),
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {selectedReport.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Progress Lifecycle Timeline */}
                <div style={{ margin: "20px 0", padding: "14px", background: "#f8faf8", borderRadius: "10px", border: "1px solid #e8eee8" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#5d7367", marginBottom: "12px", textTransform: "uppercase" }}>
                    Rescue Progress Tracker
                  </div>

                  {["CANCELLED", "NOT_FOUND"].includes(selectedReport.status) ? (
                    <div style={{ padding: "10px", background: "#fdf2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertTriangle size={14} />
                      <span>Case marked as {selectedReport.status.replace(/_/g, " ")}.</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const currentIdx = getStepIndex(selectedReport.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div
                            key={step.key}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              position: "relative",
                              zIndex: 2,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: isCurrent ? "28px" : "22px",
                                height: isCurrent ? "28px" : "22px",
                                borderRadius: "50%",
                                background: isCompleted ? "#1b7a43" : "#d8e2dc",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: isCurrent ? "12px" : "10px",
                                fontWeight: "bold",
                                border: isCurrent ? "2px solid #a3d9b6" : "none",
                              }}
                            >
                              {isCompleted ? <Check size={12} /> : idx + 1}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: isCurrent ? "700" : "500",
                                color: isCompleted ? "#1b7a43" : "#7d9185",
                                marginTop: "5px",
                                textAlign: "center",
                              }}
                            >
                              {step.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Map & Coordinates */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                    Incident Location
                  </div>
                  <MapView
                    latitude={selectedReport.latitude}
                    longitude={selectedReport.longitude}
                    address={selectedReport.address}
                    height="170px"
                  />
                  <div style={{ fontSize: "12px", color: "#61776b", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={13} flexShrink={0} />
                    <span>
                      {selectedReport.address || "Street address not detected"}
                      {selectedReport.landmark && ` (Near ${selectedReport.landmark})`}
                    </span>
                  </div>
                </div>

                {/* Assigned Volunteers */}
                {selectedReport.assignments && selectedReport.assignments.length > 0 && (
                  <div style={{ marginBottom: "18px", padding: "12px 14px", background: "#f0f8f3", borderRadius: "10px", border: "1px solid #d3e9db" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#1b7a43", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Shield size={13} />
                      <span>ASSIGNED RESCUE VOLUNTEER</span>
                    </div>
                    {selectedReport.assignments.map((asg) => (
                      <div key={asg.id} style={{ fontSize: "13px", color: "#263b31" }}>
                        <b>{asg.volunteerName}</b> &middot; {asg.volunteerPhone || asg.volunteerEmail}
                        {asg.notes && <div style={{ fontSize: "12px", color: "#547161", marginTop: "2px" }}>Note: {asg.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Case Status Logs */}
                {selectedReport.statusHistories && selectedReport.statusHistories.length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                      Treatment & Activity History
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
                      {selectedReport.statusHistories.map((log) => (
                        <div key={log.id} style={{ fontSize: "12px", padding: "8px 10px", background: "#f9faf9", borderRadius: "6px", border: "1px solid #eef2ee" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#61776b" }}>
                            <span><b>{log.changedByName}</b> &rarr; <b>{log.newStatus}</b></span>
                            <span>{new Date(log.changedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {log.note && <div style={{ color: "#374151", marginTop: "2px" }}>"{log.note}"</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
