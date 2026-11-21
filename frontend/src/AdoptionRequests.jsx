import { useEffect, useState, useMemo } from "react";
import "./AdoptionRequests.css";
import { adoptionService, BACKEND_URL } from "./services/api";
import {
  Heart,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  BarChart3,
  PawPrint,
  Clock,
  User,
  Phone,
  Mail,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPastYearMonth(monthsAgo) {
  const now = new Date();
  now.setMonth(now.getMonth() - monthsAgo);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function AdoptionRequests() {
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics" or "requests"
  
  // Applications state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Adoption Filter / Analytics state
  const currentYM = useMemo(() => getCurrentYearMonth(), []);
  const [fromMonth, setFromMonth] = useState(getPastYearMonth(11));
  const [toMonth, setToMonth] = useState(currentYM);
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  const [reportData, setReportData] = useState({
    totalAdopted: 0,
    fromDate: "",
    toDate: "",
    speciesBreakdown: {},
    animals: [],
  });
  const [loadingReport, setLoadingReport] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await adoptionService.getAllRequests();
      setRequests(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load adoption applications.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadReport = async (fMonth = fromMonth, tMonth = toMonth, species = selectedSpecies) => {
    try {
      setLoadingReport(true);
      setError("");
      const params = {};
      if (fMonth) params.fromMonth = fMonth;
      if (tMonth) params.toMonth = tMonth;
      if (species && species !== "all") params.species = species;

      const res = await adoptionService.getAdoptedReport(params);
      setReportData(res.data);
    } catch (err) {
      console.warn("Could not fetch adopted report:", err);
      // Fallback empty report
      setReportData({
        totalAdopted: 0,
        fromDate: fMonth,
        toDate: tMonth,
        speciesBreakdown: {},
        animals: [],
      });
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadRequests();
    loadReport();
  }, []);

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    loadReport(fromMonth, toMonth, selectedSpecies);
  };

  const handlePreset = (preset) => {
    let newFrom = fromMonth;
    let newTo = currentYM;

    if (preset === "this_month") {
      newFrom = currentYM;
      newTo = currentYM;
    } else if (preset === "last_month") {
      newFrom = getPastYearMonth(1);
      newTo = getPastYearMonth(1);
    } else if (preset === "last_3_months") {
      newFrom = getPastYearMonth(2);
      newTo = currentYM;
    } else if (preset === "year_to_date") {
      const year = new Date().getFullYear();
      newFrom = `${year}-01`;
      newTo = currentYM;
    } else if (preset === "all_time") {
      newFrom = "2024-01";
      newTo = currentYM;
    }

    setFromMonth(newFrom);
    setToMonth(newTo);
    loadReport(newFrom, newTo, selectedSpecies);
  };

  async function handleStatus(id, newStatus) {
    try {
      setUpdatingId(id);
      setError("");
      setMessage("");

      await adoptionService.updateRequestStatus(id, { status: newStatus });
      setMessage(
        newStatus === "APPROVED"
          ? `Application approved! The animal is now marked ADOPTED and conflicting requests were resolved.`
          : `Application was marked ${newStatus}.`
      );
      await Promise.all([loadRequests(), loadReport(fromMonth, toMonth, selectedSpecies)]);
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

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  };

  return (
    <section className="adoption-requests-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div className="adoption-requests-header" style={{ marginBottom: "20px" }}>
        <div>
          <div className="adoption-requests-eyebrow">PAWRESCUE ADOPTIONS</div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#263b31", margin: "0 0 4px" }}>
            Adoption Management & Monthly Analytics
          </h1>
          <p style={{ fontSize: "13px", color: "#5d7367", margin: 0 }}>
            Filter how many adoptions occurred from month to month, inspect adoptive homes, and review pending requests.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="adoption-alert success" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="adoption-alert error" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
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
          onClick={() => setActiveTab("analytics")}
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
            background: activeTab === "analytics" ? "#1b7a43" : "#eef4ef",
            color: activeTab === "analytics" ? "#ffffff" : "#455a4f",
            transition: "all 0.2s ease",
          }}
        >
          <BarChart3 size={15} />
          <span>Monthly Adoptions Filter & Stats</span>
          <span
            style={{
              background: activeTab === "analytics" ? "rgba(255,255,255,0.25)" : "#cbdad0",
              color: activeTab === "analytics" ? "#ffffff" : "#263b31",
              padding: "1px 7px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "800",
            }}
          >
            {reportData.totalAdopted}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
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
            background: activeTab === "requests" ? "#1b7a43" : "#eef4ef",
            color: activeTab === "requests" ? "#ffffff" : "#455a4f",
            transition: "all 0.2s ease",
          }}
        >
          <Heart size={15} />
          <span>Adoption Applications</span>
          {pendingCount > 0 && (
            <span
              style={{
                background: activeTab === "requests" ? "#bbf7d0" : "#fed7aa",
                color: activeTab === "requests" ? "#166534" : "#9a3412",
                padding: "1px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {pendingCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === "analytics" ? (
        /* TAB 1: Monthly Adoptions Analytics & Date Filtering */
        <div>
          {/* Filter Bar */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "18px 20px",
              border: "1px solid #e1ece3",
              marginBottom: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} color="#1b7a43" />
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#263b31" }}>
                  Filter Adoptions by Month / Date Range
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handlePreset("this_month")}
                  style={{
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("last_month")}
                  style={{
                    background: "#f8faf8",
                    color: "#475e51",
                    border: "1px solid #dbe5dc",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("last_3_months")}
                  style={{
                    background: "#f8faf8",
                    color: "#475e51",
                    border: "1px solid #dbe5dc",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Last 3 Months
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("year_to_date")}
                  style={{
                    background: "#f8faf8",
                    color: "#475e51",
                    border: "1px solid #dbe5dc",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Year to Date
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("all_time")}
                  style={{
                    background: "#f8faf8",
                    color: "#475e51",
                    border: "1px solid #dbe5dc",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  All Time
                </button>
              </div>
            </div>

            <form onSubmit={handleApplyFilter} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5d7367" }}>FROM MONTH</label>
                <input
                  type="month"
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #c8ded0",
                    fontSize: "13px",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5d7367" }}>TO MONTH</label>
                <input
                  type="month"
                  value={toMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #c8ded0",
                    fontSize: "13px",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#5d7367" }}>SPECIES</label>
                <select
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #c8ded0",
                    fontSize: "13px",
                    background: "#ffffff",
                  }}
                >
                  <option value="all">All Species</option>
                  <option value="Dog">Dogs</option>
                  <option value="Cat">Cats</option>
                  <option value="Bird">Birds</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingReport}
                style={{
                  background: "#1b7a43",
                  color: "#ffffff",
                  border: "none",
                  padding: "9px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: loadingReport ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Filter size={14} />
                <span>{loadingReport ? "Filtering..." : "Filter Adoptions"}</span>
              </button>
            </form>
          </div>

          {/* Metric KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            {/* Card 1: Total Adoptions in Filter Period */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #e1ece3",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#1b7a43", letterSpacing: "0.5px" }}>
                TOTAL ADOPTIONS COMPLETED
              </div>
              <div style={{ fontSize: "36px", fontWeight: "800", color: "#263b31", margin: "6px 0 2px" }}>
                {reportData.totalAdopted}
              </div>
              <div style={{ fontSize: "12px", color: "#61776b" }}>
                Placed between <b>{reportData.fromDate || fromMonth}</b> and <b>{reportData.toDate || toMonth}</b>
              </div>
            </div>

            {/* Card 2: Species Breakdown */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #e1ece3",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#5d7367", letterSpacing: "0.5px" }}>
                SPECIES BREAKDOWN
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                {Object.keys(reportData.speciesBreakdown || {}).length === 0 ? (
                  <span style={{ fontSize: "13px", color: "#8a9d92" }}>No adoptions in this period</span>
                ) : (
                  Object.entries(reportData.speciesBreakdown).map(([sp, count]) => (
                    <span
                      key={sp}
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <PawPrint size={13} />
                      <span>{sp}: <b>{count}</b></span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Adopted Animals Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e1ece3",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #eef2ee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#263b31", margin: 0 }}>
                Adopted Animals in Selected Period ({reportData.animals?.length || 0})
              </h3>
            </div>

            {loadingReport ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div className="status-spinner" style={{ margin: "0 auto 10px" }}></div>
                <p style={{ color: "#61776b", fontSize: "13px" }}>Filtering adoption records...</p>
              </div>
            ) : reportData.animals?.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Calendar size={22} color="#1b7a43" />
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#263b31", margin: "0 0 4px" }}>
                  No Adoptions Recorded in this Period
                </h4>
                <p style={{ fontSize: "13px", color: "#61776b", maxWidth: "420px", margin: "0 auto" }}>
                  No animal status transitioned to ADOPTED between {fromMonth} and {toMonth}. Try selecting a wider month range above.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="adoption-requests-table">
                  <thead>
                    <tr>
                      <th>Pet Details</th>
                      <th>Species & Breed</th>
                      <th>Adopted By</th>
                      <th>Adoption Date</th>
                      <th>Days in Care</th>
                      <th>Origin Case</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.animals.map((item) => {
                      const img = getImageUrl(item.photoUrl);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {img ? (
                                <img
                                  src={img}
                                  alt={item.name}
                                  style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: "#eef3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <PawPrint size={18} color="#94a3b8" />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "14px", color: "#263b31" }}>{item.name}</div>
                                <div style={{ fontSize: "11px", color: "#61776b" }}>{item.gender} &middot; {item.age}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "600", fontSize: "13px" }}>{item.species}</div>
                            <div style={{ fontSize: "11px", color: "#61776b" }}>{item.breed || "Mix"}</div>
                          </td>
                          <td>
                            {item.adopterName ? (
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "13px", color: "#263b31" }}>{item.adopterName}</div>
                                {item.adopterPhone && (
                                  <div style={{ fontSize: "12px", color: "#1b7a43", display: "flex", alignItems: "center", gap: "3px" }}>
                                    <Phone size={11} />
                                    <span>{item.adopterPhone}</span>
                                  </div>
                                )}
                                {item.adopterEmail && (
                                  <div style={{ fontSize: "11px", color: "#61776b" }}>{item.adopterEmail}</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#8a9d92" }}>Direct Adoption</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "#1b7a43" }}>
                              {formatDate(item.adoptedAt)}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "12px", color: "#475e51" }}>
                              {item.daysToAdoption != null ? `${item.daysToAdoption} days` : "—"}
                            </div>
                          </td>
                          <td>
                            {item.reportId ? (
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#1b7a43" }}>
                                #AR-{String(item.reportId).padStart(4, "0")}
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#8a9d92" }}>Shelter Direct</span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                background: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #86efac",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              ADOPTED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: Pending & Past Adoption Requests */
        <div className="adoption-requests-card">
          {loadingRequests ? (
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
      )}
    </section>
  );
}
