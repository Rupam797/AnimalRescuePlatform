import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { volunteerService, BACKEND_URL } from "../services/api";
import MapView from "../components/MapView";
import {
  Ambulance,
  PawPrint,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Camera,
  Upload,
  Check,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
  Clock,
  Navigation,
} from "lucide-react";

const VOLUNTEER_NEXT_STATUSES = {
  ASSIGNED: [
    { value: "RESCUED", label: "Mark Animal Rescued", style: "primary" },
    { value: "NOT_FOUND", label: "Animal Not Found", style: "danger" },
  ],
  RESCUED: [
    { value: "UNDER_TREATMENT", label: "Place Under Treatment", style: "warning" },
    { value: "RECOVERED", label: "Mark Fully Recovered", style: "success" },
  ],
  UNDER_TREATMENT: [
    { value: "RECOVERED", label: "Mark Fully Recovered", style: "success" },
  ],
};

export default function VolunteerCases() {
  const [activeTab, setActiveTab] = useState("available"); // "available" or "assigned"
  const [cases, setCases] = useState([]);
  const [availableReports, setAvailableReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);

  // Status update modal state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError("");
      const [casesRes, availableRes] = await Promise.all([
        volunteerService.getCases(),
        volunteerService.getAvailableReports(),
      ]);

      const assignedCases = casesRes.data || [];
      const incomingAlerts = availableRes.data || [];

      setCases(assignedCases);
      setAvailableReports(incomingAlerts);

      // Default active tab: if volunteer has active cases, show assigned; if not and alerts exist, show available
      if (assignedCases.length > 0) {
        setSelectedCase((current) => {
          if (!current) return assignedCases[0];
          return assignedCases.find((c) => c.id === current.id) || assignedCases[0];
        });
      } else if (incomingAlerts.length > 0) {
        setActiveTab("available");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load volunteer dispatch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleClaimReport = async (reportId) => {
    try {
      setClaimingId(reportId);
      setError("");
      const res = await volunteerService.claimCase(reportId);
      const claimedReport = res.data;

      setNotice(`Rescue mission accepted! Case #${claimedReport.id} (${claimedReport.animalName}) has been added to your active cases.`);
      
      // Refresh data
      const [casesRes, availableRes] = await Promise.all([
        volunteerService.getCases(),
        volunteerService.getAvailableReports(),
      ]);
      setCases(casesRes.data || []);
      setAvailableReports(availableRes.data || []);
      
      // Auto-select the claimed case and switch tab
      setSelectedCase(claimedReport);
      setActiveTab("assigned");
    } catch (err) {
      setError(err.response?.data?.message || "Could not claim rescue case. It may have already been assigned.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedCase) return;
    setUpdatingStatus(true);
    setError("");

    try {
      const res = await volunteerService.updateCaseStatus(selectedCase.id, {
        status: newStatus,
        note: statusNote.trim() || `Volunteer transitioned status to ${newStatus}`,
      });

      setSelectedCase(res.data);
      setStatusNote("");
      setNotice(`Case #${res.data.id} updated to ${res.data.status}!`);
      
      // Refresh cases list
      const casesRes = await volunteerService.getCases();
      setCases(casesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds 5 MB limit.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile || !selectedCase) return;

    setUploadingPhoto(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", photoFile);

      const res = await volunteerService.addCasePhoto(selectedCase.id, formData);
      setSelectedCase(res.data);
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setNotice("Treatment progress photo uploaded successfully!");
      
      const casesRes = await volunteerService.getCases();
      setCases(casesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "1140px", margin: "28px auto 48px", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#fef7ed",
              color: "#c27803",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: "8px",
              border: "1px solid #fed7aa",
            }}
          >
            <Ambulance size={13} />
            <span>VOLUNTEER RESCUE DISPATCH</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#263b31", margin: 0 }}>
            Rescue Dispatch Center
          </h1>
          <p style={{ fontSize: "13px", color: "#5d7367", marginTop: "3px" }}>
            Respond to emergency reports, accept rescue missions, and log medical treatment through recovery.
          </p>
        </div>

        {/* Notices */}
        {notice && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={16} flexShrink={0} />
            <span>{notice}</span>
          </div>
        )}

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
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid #e2ebe4",
            paddingBottom: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("available")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === "available" ? "#1b7a43" : "#eef4ef",
              color: activeTab === "available" ? "#ffffff" : "#455a4f",
              transition: "all 0.2s ease",
            }}
          >
            <AlertTriangle size={15} />
            <span>Incoming Distress Alerts</span>
            <span
              style={{
                background: activeTab === "available" ? "rgba(255,255,255,0.25)" : "#cbdad0",
                color: activeTab === "available" ? "#ffffff" : "#263b31",
                padding: "1px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {availableReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === "assigned" ? "#1b7a43" : "#eef4ef",
              color: activeTab === "assigned" ? "#ffffff" : "#455a4f",
              transition: "all 0.2s ease",
            }}
          >
            <ClipboardList size={15} />
            <span>My Active Cases</span>
            <span
              style={{
                background: activeTab === "assigned" ? "rgba(255,255,255,0.25)" : "#cbdad0",
                color: activeTab === "assigned" ? "#ffffff" : "#263b31",
                padding: "1px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {cases.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="status-spinner" style={{ margin: "0 auto 12px" }}></div>
            <p style={{ color: "#61776b", fontSize: "14px" }}>Loading dispatch records...</p>
          </div>
        ) : activeTab === "available" ? (
          /* TAB 1: Incoming Emergency Distress Reports */
          <div>
            {availableReports.length === 0 ? (
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
                    <CheckCircle2 size={24} color="#1b7a43" />
                  </div>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#263b31", margin: "0 0 4px" }}>
                  No Pending Distress Calls
                </h3>
                <p style={{ color: "#61776b", fontSize: "13px", maxWidth: "420px", margin: "0 auto" }}>
                  All reported injured animals are currently assigned or receiving care. New emergency alerts submitted by citizens will appear here in real-time.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "18px",
                }}
              >
                {availableReports.map((report) => {
                  const firstImg = report.images && report.images.length > 0 ? getImageUrl(report.images[0]) : null;
                  const isClaiming = claimingId === report.id;
                  const isCritical = report.severity === "CRITICAL";

                  return (
                    <div
                      key={report.id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        border: isCritical ? "1.5px solid #fca5a5" : "1px solid #e1ece3",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                    >
                      {/* Image Preview & Badges */}
                      <div
                        style={{
                          height: "170px",
                          background: "#eef3ef",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {firstImg ? (
                          <img
                            src={firstImg}
                            alt={report.animalName}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <PawPrint size={36} color="#94a3b8" />
                          </div>
                        )}

                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            display: "flex",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              background: isCritical ? "#ef4444" : report.severity === "HIGH" ? "#f97316" : "#22c55e",
                              color: "#ffffff",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "800",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {report.severity}
                          </span>
                          <span
                            style={{
                              background: "rgba(0,0,0,0.6)",
                              color: "#ffffff",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {report.animalType}
                          </span>
                        </div>

                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            background: "rgba(0,0,0,0.65)",
                            color: "#ffffff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock size={11} />
                          <span>{formatTimeAgo(report.createdAt)}</span>
                        </div>
                      </div>

                      {/* Details Body */}
                      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#1b7a43", marginBottom: "2px" }}>
                          EMERGENCY CASE #AR-{String(report.id).padStart(4, "0")}
                        </div>
                        <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#263b31", margin: "0 0 6px" }}>
                          {report.animalName || `Injured ${report.animalType}`}
                        </h3>

                        <p
                          style={{
                            fontSize: "13px",
                            color: "#475569",
                            lineHeight: "1.5",
                            margin: "0 0 12px",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {report.description}
                        </p>

                        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                          <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "flex-start", gap: "5px" }}>
                            <MapPin size={14} color="#1b7a43" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <span>
                              {report.address || `${report.latitude}, ${report.longitude}`}
                              {report.landmark && <span style={{ color: "#94a3b8" }}> (Near: {report.landmark})</span>}
                            </span>
                          </div>

                          {report.contactPhone && (
                            <div style={{ fontSize: "12px", color: "#1b7a43", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" }}>
                              <Phone size={13} style={{ flexShrink: 0 }} />
                              <span>Reporter: <a href={`tel:${report.contactPhone}`} style={{ color: "#1b7a43", textDecoration: "none" }}>{report.contactPhone}</a></span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                          <button
                            type="button"
                            disabled={isClaiming}
                            onClick={() => handleClaimReport(report.id)}
                            style={{
                              background: "#1b7a43",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: isClaiming ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              opacity: isClaiming ? 0.7 : 1,
                            }}
                          >
                            <Ambulance size={15} />
                            <span>{isClaiming ? "Accepting..." : "Accept & Start Rescue"}</span>
                          </button>

                          {report.latitude && report.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f1f5f9",
                                color: "#334155",
                                borderRadius: "8px",
                                padding: "10px 12px",
                                textDecoration: "none",
                                border: "1px solid #e2e8f0",
                              }}
                              title="Open in Google Maps"
                            >
                              <Navigation size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: My Active Cases */
          <div>
            {cases.length === 0 ? (
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
                    <ClipboardList size={24} color="#1b7a43" />
                  </div>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#263b31", margin: "0 0 4px" }}>
                  No Active Cases Assigned
                </h3>
                <p style={{ color: "#61776b", fontSize: "13px", maxWidth: "400px", margin: "0 auto 16px" }}>
                  You currently have no rescue cases underway. Check incoming distress alerts to claim an emergency mission.
                </p>
                {availableReports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("available")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "#1b7a43",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Ambulance size={14} />
                    <span>View {availableReports.length} Incoming Distress Alerts</span>
                  </button>
                )}
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
                {/* Left Column: Assigned Cases List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {cases.map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    const firstImg = c.images && c.images.length > 0 ? getImageUrl(c.images[0]) : null;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        style={{
                          background: "#ffffff",
                          borderRadius: "12px",
                          padding: "14px",
                          border: isSelected ? "2px solid #1b7a43" : "1px solid #e1ece3",
                          cursor: "pointer",
                          display: "flex",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "10px",
                            background: "#eef3ef",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {firstImg ? (
                            <img src={firstImg} alt={c.animalName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <PawPrint size={22} color="#94a3b8" />
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                            <div style={{ fontWeight: "700", fontSize: "15px", color: "#263b31" }}>
                              {c.animalName || `Case #${c.id}`}
                            </div>
                            <span
                              style={{
                                background: c.severity === "CRITICAL" ? "#fef2f2" : "#fef9ee",
                                color: c.severity === "CRITICAL" ? "#c81e1e" : "#b45309",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "700",
                              }}
                            >
                              {c.severity}
                            </span>
                          </div>

                          <div style={{ fontSize: "12px", color: "#4f6759", marginBottom: "3px" }}>
                            {c.animalType} &middot; Status: <b>{c.status.replace(/_/g, " ")}</b>
                          </div>

                          <div style={{ fontSize: "11px", color: "#7a9082", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={12} flexShrink={0} />
                            <span>{c.address || `${c.latitude}, ${c.longitude}`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Case Management Workspace */}
                {selectedCase && (
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "24px",
                      border: "1px solid #e1ece3",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#1b7a43" }}>
                          CASE #AR-{String(selectedCase.id).padStart(4, "0")}
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                          {selectedCase.animalName}
                        </h2>
                        <div style={{ fontSize: "12px", color: "#61776b", marginTop: "2px" }}>
                          {selectedCase.animalType} &middot; Priority: <b>{selectedCase.severity}</b>
                        </div>
                      </div>

                      <span
                        style={{
                          background: "#e8f5ec",
                          color: "#1b7a43",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        {selectedCase.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Condition & Reporter Notes */}
                    <div style={{ background: "#f9faf9", padding: "12px 14px", borderRadius: "10px", border: "1px solid #eef2ee", marginBottom: "18px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#5d7367", marginBottom: "4px" }}>
                        REPORTED CONDITION & INJURIES
                      </div>
                      <p style={{ fontSize: "13px", color: "#263b31", margin: 0, lineHeight: 1.5 }}>
                        {selectedCase.description}
                      </p>
                      {selectedCase.contactPhone && (
                        <div style={{ fontSize: "12px", color: "#1b7a43", marginTop: "6px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Phone size={12} />
                          <span>Reporter: <a href={`tel:${selectedCase.contactPhone}`} style={{ color: "#1b7a43" }}>{selectedCase.contactPhone}</a></span>
                        </div>
                      )}
                    </div>

                    {/* Map with Google Maps Navigation */}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31" }}>
                          Location & Directions
                        </div>
                        {selectedCase.latitude && selectedCase.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedCase.latitude},${selectedCase.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "11px",
                              color: "#1b7a43",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              textDecoration: "none",
                            }}
                          >
                            <span>Open Google Maps</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <MapView
                        latitude={selectedCase.latitude}
                        longitude={selectedCase.longitude}
                        address={selectedCase.address}
                        height="180px"
                      />
                      <div style={{ fontSize: "12px", color: "#5d7367", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} flexShrink={0} />
                        <span>
                          {selectedCase.address}
                          {selectedCase.landmark && ` (Landmark: ${selectedCase.landmark})`}
                        </span>
                      </div>
                    </div>

                    {/* Status Transitions Action Box */}
                    {VOLUNTEER_NEXT_STATUSES[selectedCase.status] && (
                      <div
                        style={{
                          background: "#f4fbf6",
                          padding: "16px",
                          borderRadius: "10px",
                          border: "1px solid #d4ebdc",
                          marginBottom: "20px",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#1b7a43", marginBottom: "8px" }}>
                          Update Case Status
                        </div>

                        <div style={{ marginBottom: "10px" }}>
                          <input
                            type="text"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Add medical / treatment note (optional)..."
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: "6px",
                              border: "1px solid #c8ded0",
                              fontSize: "13px",
                              background: "#ffffff",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {VOLUNTEER_NEXT_STATUSES[selectedCase.status].map((btn) => (
                            <button
                              key={btn.value}
                              type="button"
                              disabled={updatingStatus}
                              onClick={() => handleStatusUpdate(btn.value)}
                              style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                background: btn.style === "danger" ? "#b91c1c" : btn.style === "warning" ? "#d97706" : "#1b7a43",
                                color: "#ffffff",
                                border: "none",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: updatingStatus ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Check size={13} />
                              <span>{updatingStatus ? "Updating..." : btn.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Treatment Progress Photo */}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                        Add Progress / Treatment Photo
                      </div>

                      <form onSubmit={handlePhotoUpload} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <label
                          style={{
                            padding: "7px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d4dfd7",
                            background: "#f9faf9",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#374151",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Camera size={14} />
                          <span>{photoFile ? photoFile.name : "Choose Photo"}</span>
                          <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                        </label>

                        {photoFile && (
                          <button
                            type="submit"
                            disabled={uploadingPhoto}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "6px",
                              background: "#1b7a43",
                              color: "#ffffff",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Upload size={13} />
                            <span>{uploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                          </button>
                        )}
                      </form>

                      {/* Photo Gallery of Case */}
                      {selectedCase.images && selectedCase.images.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", overflowX: "auto" }}>
                          {selectedCase.images.map((img, i) => (
                            <img
                              key={i}
                              src={getImageUrl(img)}
                              alt={`Progress ${i}`}
                              style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e1ece3" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Case Status History */}
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                        Case Activity Logs
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {selectedCase.statusHistories?.map((log) => (
                          <div key={log.id} style={{ fontSize: "12px", padding: "8px 10px", background: "#f8faf8", borderRadius: "6px", border: "1px solid #eef2ee" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#5d7367" }}>
                              <span><b>{log.changedByName}</b> &rarr; {log.newStatus}</span>
                              <span>{new Date(log.changedAt).toLocaleString()}</span>
                            </div>
                            {log.note && <div style={{ color: "#263b31", marginTop: "2px" }}>"{log.note}"</div>}
                          </div>
                        ))}
                      </div>
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