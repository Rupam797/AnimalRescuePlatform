import { useEffect, useState, useMemo } from "react";
import "./AnimalReports.css";
import { reportService, adminService, BACKEND_URL } from "./services/api";
import MapView from "./components/MapView";
import {
  PawPrint,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus,
  Clock,
  Ambulance,
  Shield,
  Stethoscope,
  Phone,
  Navigation,
  ExternalLink,
  RefreshCw,
  UserX,
} from "lucide-react";

const ALL_STATUSES = [
  "REPORTED",
  "ASSIGNED",
  "RESCUED",
  "UNDER_TREATMENT",
  "RECOVERED",
  "LISTED_FOR_ADOPTION",
  "ADOPTED",
  "CANCELLED",
  "NOT_FOUND",
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function timeAgo(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function AnimalReports() {
  const [reports, setReports] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [volunteerFilter, setVolunteerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Modals
  const [viewingMapReport, setViewingMapReport] = useState(null);
  const [viewingTimelineReport, setViewingTimelineReport] = useState(null);
  const [dispatchModalReport, setDispatchModalReport] = useState(null);
  const [clinicalModalReport, setClinicalModalReport] = useState(null);

  // Dispatch modal form
  const [dispatchVolunteerId, setDispatchVolunteerId] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  // Clinical note modal form
  const [clinicalStatus, setClinicalStatus] = useState("UNDER_TREATMENT");
  const [clinicalNote, setClinicalNote] = useState("");
  const [clinicalSubmitting, setClinicalSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [reportsRes, volRes] = await Promise.all([
        reportService.getAll(),
        adminService.getVolunteers(),
      ]);
      setReports(reportsRes.data);
      setVolunteers(volRes.data.filter((v) => v.approved));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load animal reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to get active assigned volunteer
  function getActiveAssignment(item) {
    if (!item.assignments || item.assignments.length === 0) return null;
    const active = item.assignments.find((a) => a.active);
    if (active) return active;
    const last = item.assignments[item.assignments.length - 1];
    return last.active !== false ? last : null;
  }

  // Dispatch or Reassign volunteer
  async function handleDispatchSubmit(e) {
    if (e) e.preventDefault();
    if (!dispatchModalReport || !dispatchVolunteerId) return;

    try {
      setDispatchSubmitting(true);
      setError("");
      setMessage("");

      const currentActive = getActiveAssignment(dispatchModalReport);
      const isReassignment = Boolean(currentActive && String(currentActive.volunteerId) !== String(dispatchVolunteerId));

      const res = await reportService.assignVolunteer(dispatchModalReport.id, {
        volunteerId: Number(dispatchVolunteerId),
        notes: dispatchNotes.trim() || (isReassignment ? "Reassigned via Animal Reports Dispatch" : "Assigned via Animal Reports Dispatch"),
      });

      setReports((current) => current.map((r) => (r.id === res.data.id ? res.data : r)));
      
      const assignedVolunteerName = volunteers.find((v) => v.id === Number(dispatchVolunteerId))?.name || "volunteer";
      if (isReassignment) {
        setMessage(`Report #${dispatchModalReport.id} successfully reassigned to ${assignedVolunteerName}!`);
      } else {
        setMessage(`Volunteer ${assignedVolunteerName} assigned to Report #${dispatchModalReport.id}!`);
      }

      if (viewingTimelineReport && viewingTimelineReport.id === dispatchModalReport.id) {
        setViewingTimelineReport(res.data);
      }

      setDispatchModalReport(null);
      setDispatchVolunteerId("");
      setDispatchNotes("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign volunteer.");
    } finally {
      setDispatchSubmitting(false);
    }
  }

  // Handle Unassigning Volunteer
  async function handleUnassign(reportId) {
    if (!reportId) return;
    try {
      setDispatchSubmitting(true);
      setError("");
      setMessage("");

      const res = await reportService.unassignVolunteer(reportId);
      setReports((current) => current.map((r) => (r.id === res.data.id ? res.data : r)));
      setMessage(`Volunteer unassigned from Report #${reportId}. Case returned to unassigned pool.`);

      if (viewingTimelineReport && viewingTimelineReport.id === reportId) {
        setViewingTimelineReport(res.data);
      }
      setDispatchModalReport(null);
      setDispatchVolunteerId("");
      setDispatchNotes("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unassign volunteer.");
    } finally {
      setDispatchSubmitting(false);
    }
  }

  // Update clinical recovery / medical triage note
  async function handleClinicalSubmit(e) {
    if (e) e.preventDefault();
    if (!clinicalModalReport) return;

    try {
      setClinicalSubmitting(true);
      setError("");
      setMessage("");

      const res = await reportService.updateStatus(clinicalModalReport.id, {
        status: clinicalStatus,
        note: clinicalNote.trim() || `Clinical status changed to ${clinicalStatus}`,
      });

      setReports((current) => current.map((r) => (r.id === res.data.id ? res.data : r)));
      setMessage(`Clinical recovery log saved for Report #${clinicalModalReport.id}!`);

      if (viewingTimelineReport && viewingTimelineReport.id === clinicalModalReport.id) {
        setViewingTimelineReport(res.data);
      }

      setClinicalModalReport(null);
      setClinicalNote("");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setClinicalSubmitting(false);
    }
  }

  // Direct status dropdown change
  async function handleInlineStatusUpdate(report, newStatus) {
    try {
      setUpdatingId(report.id);
      setError("");
      setMessage("");

      const response = await reportService.updateStatus(report.id, {
        status: newStatus,
        note: `Admin updated status to ${newStatus}`,
      });

      setReports((current) =>
        current.map((item) => (item.id === response.data.id ? response.data : item))
      );

      setMessage(`${response.data.animalName}'s status is now ${response.data.status}.`);

      if (viewingTimelineReport && viewingTimelineReport.id === report.id) {
        setViewingTimelineReport(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function getImageUrl(images) {
    if (!images || images.length === 0) return null;
    const path = images[0];
    return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  }

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const activeVol = getActiveAssignment(report);

      // Search
      const query = search.trim().toLowerCase();
      if (query) {
        const matches = [
          report.animalName,
          report.animalType,
          report.address,
          report.landmark,
          report.status,
          `#ar-${String(report.id).padStart(4, "0")}`,
          String(report.id),
          report.severity,
          report.reporterName,
          activeVol?.volunteerName,
          ...(report.assignments || []).map((a) => a.volunteerName),
          ...(report.assignments || []).map((a) => a.assignedByName),
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

        if (!matches) return false;
      }

      // Volunteer filter
      if (volunteerFilter === "UNASSIGNED") {
        if (activeVol) return false;
      } else if (volunteerFilter === "ASSIGNED") {
        if (!activeVol) return false;
      } else if (volunteerFilter !== "ALL") {
        const volId = Number(volunteerFilter);
        if (!activeVol || activeVol.volunteerId !== volId) return false;
      }

      // Status filter
      if (statusFilter === "NEEDS_DISPATCH") {
        if (report.status !== "REPORTED" || activeVol) return false;
      } else if (statusFilter === "ACTIVE") {
        if (!["ASSIGNED", "RESCUED"].includes(report.status)) return false;
      } else if (statusFilter === "CLINIC") {
        if (report.status !== "UNDER_TREATMENT") return false;
      } else if (statusFilter === "RECOVERED") {
        if (!["RECOVERED", "LISTED_FOR_ADOPTION", "ADOPTED"].includes(report.status)) return false;
      } else if (statusFilter !== "ALL") {
        if (report.status !== statusFilter) return false;
      }

      // Severity filter
      if (severityFilter !== "ALL" && report.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [reports, search, volunteerFilter, statusFilter, severityFilter]);

  // Statistics
  const totalReportsCount = reports.length;
  const unassignedCount = reports.filter((r) => !getActiveAssignment(r)).length;
  const inFieldCount = reports.filter((r) => ["ASSIGNED", "RESCUED"].includes(r.status)).length;
  const inTreatmentCount = reports.filter((r) => r.status === "UNDER_TREATMENT").length;
  const recoveredCount = reports.filter((r) =>
    ["RECOVERED", "LISTED_FOR_ADOPTION", "ADOPTED"].includes(r.status)
  ).length;

  const modalActiveAssignment = dispatchModalReport ? getActiveAssignment(dispatchModalReport) : null;
  const isReassignMode = Boolean(modalActiveAssignment);

  return (
    <section className="animal-reports-page">
      {/* Page Header */}
      <div className="animal-reports-heading">
        <div>
          <div className="animal-reports-eyebrow">PAWRESCUE DISPATCH</div>
          <h1>Animal Reports & Dispatch</h1>
          <p>Review distress reports, inspect GPS locations, assign or reassign rescue volunteers, and track clinical recovery.</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #d4dfd7",
            background: "#ffffff",
            color: "#166534",
            fontWeight: "700",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={13} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* KPI Overview Summary */}
      <div className="animal-report-summary">
        <article>
          <span>Total Distress Reports</span>
          <strong>{totalReportsCount}</strong>
          <div style={{ fontSize: "11px", color: "#61776b", marginTop: "4px" }}>
            {unassignedCount} awaiting volunteer dispatch
          </div>
        </article>

        <article>
          <span>Awaiting Dispatch</span>
          <strong style={{ color: "#b45309" }}>{unassignedCount}</strong>
          <div style={{ fontSize: "11px", color: "#b45309", marginTop: "4px" }}>
            Needs immediate volunteer assignment
          </div>
        </article>

        <article>
          <span>Clinical Recovery</span>
          <strong style={{ color: "#2563eb" }}>{inTreatmentCount}</strong>
          <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "4px" }}>
            Veterinary triage & recovery
          </div>
        </article>

        <article>
          <span>Safely Recovered</span>
          <strong style={{ color: "#166534" }}>{recoveredCount}</strong>
          <div style={{ fontSize: "11px", color: "#166534", marginTop: "4px" }}>
            Rehabilitated / Placed for adoption
          </div>
        </article>
      </div>

      {/* Alerts */}
      {message && (
        <div className="animal-reports-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="animal-reports-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="animal-reports-card">
        {/* Filters Toolbar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #eef2ee",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px" }}>
            <Search
              size={15}
              color="#7c9285"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="search"
              placeholder="Search by animal, #AR ID, location, volunteer, reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: "8px",
                border: "1px solid #d4dfd7",
                fontSize: "12px",
                background: "#ffffff",
                color: "#263b31",
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Volunteer filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Ambulance size={14} color="#1b7a43" />
              <select
                value={volunteerFilter}
                onChange={(e) => setVolunteerFilter(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #d4dfd7",
                  fontSize: "12px",
                  color: "#263b31",
                  background: "#ffffff",
                  fontWeight: "600",
                }}
              >
                <option value="ALL">All Volunteers (All Reports)</option>
                <option value="UNASSIGNED">Only Unassigned Reports</option>
                <option value="ASSIGNED">Only Assigned Reports</option>
                <optgroup label="Filter by Current Volunteer">
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Volunteer)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid #d4dfd7",
                fontSize: "12px",
                color: "#263b31",
                background: "#ffffff",
                fontWeight: "600",
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEEDS_DISPATCH">Needs Volunteer Dispatch</option>
              <option value="ACTIVE">In Field Rescue</option>
              <option value="CLINIC">In Clinical Care</option>
              <option value="RECOVERED">Recovered & Safe</option>
              <optgroup label="Exact Status">
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, " ")}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid #d4dfd7",
                fontSize: "12px",
                color: "#263b31",
                background: "#ffffff",
                fontWeight: "600",
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="animal-reports-state">Loading reports from database...</div>
        ) : filteredReports.length === 0 ? (
          <div className="animal-reports-state">
            <PawPrint size={32} color="#94a3b8" style={{ marginBottom: "8px" }} />
            <div>No animal reports found matching your active filters.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="animal-reports-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Animal & Distress Info</th>
                  <th>Priority</th>
                  <th>Location & GPS</th>
                  <th>Assigned Volunteer & Dispatcher</th>
                  <th>Status & Recovery</th>
                  <th>Reported</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const imageSrc = getImageUrl(report.images);
                  const assignedVol = getActiveAssignment(report);

                  return (
                    <tr key={report.id}>
                      {/* Case ID */}
                      <td>
                        <strong>#AR-{String(report.id).padStart(4, "0")}</strong>
                      </td>

                      {/* Animal details */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={report.animalName}
                              style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "8px",
                                background: "#eef3ef",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <PawPrint size={20} color="#94a3b8" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "#263b31" }}>{report.animalName || "Unknown"}</div>
                            <div style={{ fontSize: "11px", color: "#61776b" }}>{report.animalType}</div>
                            {report.description && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#788f82",
                                  maxWidth: "200px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  marginTop: "2px",
                                }}
                              >
                                {report.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "5px",
                            fontSize: "10px",
                            fontWeight: "800",
                            letterSpacing: "0.4px",
                            background:
                              report.severity === "CRITICAL"
                                ? "#fef2f2"
                                : report.severity === "HIGH"
                                ? "#fff7ed"
                                : report.severity === "MEDIUM"
                                ? "#fefce8"
                                : "#ecfdf5",
                            color:
                              report.severity === "CRITICAL"
                                ? "#b91c1c"
                                : report.severity === "HIGH"
                                ? "#c2410c"
                                : report.severity === "MEDIUM"
                                ? "#a16207"
                                : "#047857",
                            border: `1px solid ${
                              report.severity === "CRITICAL"
                                ? "#fecaca"
                                : report.severity === "HIGH"
                                ? "#ffedd5"
                                : report.severity === "MEDIUM"
                                ? "#fef08a"
                                : "#a7f3d0"
                            }`,
                          }}
                        >
                          {report.severity}
                        </span>
                      </td>

                      {/* Location & GPS */}
                      <td>
                        <div style={{ fontSize: "12px", color: "#263b31", fontWeight: "600", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {report.address || "GPS Position"}
                        </div>
                        {report.landmark && (
                          <div style={{ fontSize: "11px", color: "#61776b" }}>
                            Near: {report.landmark}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <button
                            type="button"
                            onClick={() => setViewingMapReport(report)}
                            style={{
                              background: "#e8f5ec",
                              color: "#1b7a43",
                              border: "1px solid #c9e4d1",
                              padding: "2px 6px",
                              borderRadius: "5px",
                              fontSize: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <MapPin size={10} />
                            <span>Inspect GPS</span>
                          </button>

                          {report.latitude && report.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#2563eb",
                                fontSize: "10px",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                textDecoration: "none",
                              }}
                              title="Directions via Google Maps"
                            >
                              <Navigation size={10} />
                              <span>Route</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Which Volunteer Went for Rescue */}
                      <td>
                        {assignedVol ? (
                          <div style={{ maxWidth: "220px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Ambulance size={14} color="#1b7a43" />
                              <strong style={{ fontSize: "13px", color: "#166534" }}>
                                {assignedVol.volunteerName}
                              </strong>
                            </div>

                            {assignedVol.volunteerPhone && (
                              <div style={{ fontSize: "11px", color: "#1b7a43", marginTop: "2px", display: "flex", alignItems: "center", gap: "3px" }}>
                                <Phone size={10} />
                                <a
                                  href={`tel:${assignedVol.volunteerPhone}`}
                                  style={{ color: "#1b7a43", textDecoration: "none", fontWeight: "600" }}
                                >
                                  {assignedVol.volunteerPhone}
                                </a>
                              </div>
                            )}

                            <div style={{ fontSize: "11px", color: "#61776b", marginTop: "2px" }}>
                              Assigned by: <b>{assignedVol.assignedByName || "System Admin"}</b>
                            </div>
                            <div style={{ fontSize: "10px", color: "#059669", marginTop: "1px" }}>
                              Dispatched: {formatDate(assignedVol.assignedAt)} ({timeAgo(assignedVol.assignedAt)})
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setDispatchModalReport(report);
                                setDispatchVolunteerId("");
                                setDispatchNotes("");
                              }}
                              style={{
                                marginTop: "5px",
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                color: "#166534",
                                padding: "3px 8px",
                                borderRadius: "5px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <RefreshCw size={11} />
                              <span>Reassign / Change</span>
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "5px",
                                background: "#fef3c7",
                                color: "#92400e",
                                border: "1px solid #fde68a",
                                fontSize: "11px",
                                fontWeight: "700",
                                marginBottom: "4px",
                              }}
                            >
                              Unassigned
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDispatchModalReport(report);
                                  setDispatchVolunteerId("");
                                  setDispatchNotes("");
                                }}
                                style={{
                                  background: "#1b7a43",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "4px 9px",
                                  borderRadius: "5px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <UserPlus size={11} />
                                <span>Dispatch Volunteer</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status & Recovery */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <select
                            value={report.status}
                            disabled={updatingId === report.id}
                            onChange={(e) => handleInlineStatusUpdate(report, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              border: "1px solid #d4dfd7",
                              background:
                                report.status === "RECOVERED"
                                  ? "#ecfdf5"
                                  : report.status === "UNDER_TREATMENT"
                                  ? "#eff6ff"
                                  : report.status === "RESCUED"
                                  ? "#f0fdf4"
                                  : report.status === "ASSIGNED"
                                  ? "#fffbeb"
                                  : "#ffffff",
                              color:
                                report.status === "RECOVERED"
                                  ? "#047857"
                                  : report.status === "UNDER_TREATMENT"
                                  ? "#1d4ed8"
                                  : report.status === "RESCUED"
                                  ? "#15803d"
                                  : report.status === "ASSIGNED"
                                  ? "#b45309"
                                  : "#374151",
                            }}
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setClinicalModalReport(report);
                              setClinicalStatus(
                                report.status === "RESCUED"
                                  ? "UNDER_TREATMENT"
                                  : report.status === "UNDER_TREATMENT"
                                  ? "RECOVERED"
                                  : report.status
                              );
                              setClinicalNote("");
                            }}
                            style={{
                              background: "#f0f7ff",
                              border: "1px solid #bfdbfe",
                              color: "#1d4ed8",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              width: "fit-content",
                            }}
                          >
                            <Stethoscope size={10} />
                            <span>Log Clinical Note</span>
                          </button>
                        </div>
                      </td>

                      {/* Reported At */}
                      <td>
                        <div style={{ fontSize: "11px", color: "#374151", fontWeight: "600" }}>
                          {formatDate(report.createdAt)}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                          {timeAgo(report.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setViewingTimelineReport(report)}
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #c8ded0",
                              color: "#166534",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Audit which volunteer went for rescue and complete operation timeline"
                          >
                            <Clock size={12} />
                            <span>Audit Timeline</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingMapReport(report)}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #d4dfd7",
                              color: "#374151",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <MapPin size={12} />
                            <span>GPS Map</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: GPS Location Inspection Modal
          ========================================================================= */}
      {viewingMapReport && (
        <div className="modal-backdrop" onClick={() => setViewingMapReport(null)}>
          <div className="modal-card" style={{ maxWidth: "560px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b7a43", letterSpacing: "0.5px" }}>
                  INSPECT GPS DISTRESS LOCATION
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  {viewingMapReport.animalName} (#AR-{String(viewingMapReport.id).padStart(4, "0")})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingMapReport(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <MapView
              latitude={viewingMapReport.latitude}
              longitude={viewingMapReport.longitude}
              address={viewingMapReport.address}
              height="240px"
            />

            <div style={{ marginTop: "14px", padding: "12px", background: "#f8faf8", borderRadius: "8px", border: "1px solid #e2ebe4", fontSize: "13px", lineHeight: "1.6", color: "#263b31" }}>
              <div><b>Address:</b> {viewingMapReport.address || "No text address"}</div>
              {viewingMapReport.landmark && <div><b>Landmark:</b> {viewingMapReport.landmark}</div>}
              <div>
                <b>GPS Coordinates:</b> {viewingMapReport.latitude}, {viewingMapReport.longitude}
              </div>
              <div><b>Condition:</b> {viewingMapReport.description}</div>
              {viewingMapReport.contactPhone && (
                <div>
                  <b>Reporter Phone:</b>{" "}
                  <a href={`tel:${viewingMapReport.contactPhone}`} style={{ color: "#1b7a43", fontWeight: "700" }}>
                    {viewingMapReport.contactPhone}
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {viewingMapReport.latitude && viewingMapReport.longitude ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${viewingMapReport.latitude},${viewingMapReport.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    background: "#2563eb",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "12px",
                  }}
                >
                  <Navigation size={13} />
                  <span>Open in Google Maps Directions</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                onClick={() => setViewingMapReport(null)}
                style={{ padding: "8px 18px", borderRadius: "6px", background: "#1b7a43", color: "#fff", border: "none", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Volunteer Dispatch / Reassignment Modal
          ========================================================================= */}
      {dispatchModalReport && (
        <div className="modal-backdrop" onClick={() => !dispatchSubmitting && setDispatchModalReport(null)}>
          <div className="modal-card" style={{ maxWidth: "520px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b7a43", letterSpacing: "0.5px" }}>
                  {isReassignMode ? "REASSIGN VOLUNTEER" : "DISPATCH VOLUNTEER"}
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  {isReassignMode ? "Reassign Another Volunteer" : "Dispatch Volunteer"} &middot; #{String(dispatchModalReport.id).padStart(4, "0")} ({dispatchModalReport.animalName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalReport(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Currently assigned information box */}
            {modalActiveAssignment && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#166534" }}>CURRENTLY ASSIGNED VOLUNTEER</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#166534", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Ambulance size={15} />
                  <span>{modalActiveAssignment.volunteerName}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#365343", marginTop: "3px" }}>
                  Contact: <b>{modalActiveAssignment.volunteerPhone || "N/A"}</b> &middot; Dispatched: {formatDate(modalActiveAssignment.assignedAt)} ({timeAgo(modalActiveAssignment.assignedAt)})
                </div>
              </div>
            )}

            {/* Status Notice if NOT FOUND */}
            {dispatchModalReport.status === "NOT_FOUND" && (
              <div
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                <strong>Status Update Notice:</strong> This report was marked as <b>NOT FOUND</b>. Reassigning a new volunteer will reset the case status to <b>ASSIGNED</b> so the new volunteer can resume rescue search.
              </div>
            )}

            <form onSubmit={handleDispatchSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                  {isReassignMode ? "Select New Volunteer to Take Over Case *" : "Select Approved Volunteer *"}
                </label>
                <select
                  required
                  value={dispatchVolunteerId}
                  onChange={(e) => setDispatchVolunteerId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "13px",
                    color: "#263b31",
                    background: "#ffffff",
                    fontWeight: "600",
                  }}
                >
                  <option value="">Choose another active volunteer...</option>
                  {volunteers.map((v) => {
                    const isCurrent = modalActiveAssignment && v.id === modalActiveAssignment.volunteerId;
                    return (
                      <option key={v.id} value={v.id} disabled={isCurrent}>
                        {v.name} {isCurrent ? "— (Currently Assigned)" : `— Phone: ${v.phone || v.email}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                  {isReassignMode ? "Reassignment Instructions / Reason" : "Field Dispatch Instructions"}
                </label>
                <textarea
                  rows={3}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder={
                    isReassignMode
                      ? "e.g. Reassigning to another volunteer with updated area directions."
                      : "e.g. Bring dog crate and muzzle. Reported animal is near the school corner."
                  }
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {isReassignMode ? (
                  <button
                    type="button"
                    onClick={() => handleUnassign(dispatchModalReport.id)}
                    disabled={dispatchSubmitting}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Remove volunteer and reset case to unassigned open distress pool"
                  >
                    <UserX size={14} />
                    <span>Unassign Current Volunteer</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setDispatchModalReport(null)}
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
                    disabled={dispatchSubmitting || !dispatchVolunteerId}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: "#1b7a43",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: dispatchSubmitting || !dispatchVolunteerId ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Ambulance size={14} />
                    <span>{dispatchSubmitting ? "Updating..." : isReassignMode ? "Confirm Reassignment" : "Confirm Dispatch"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Clinical Recovery & Medical Notes Modal
          ========================================================================= */}
      {clinicalModalReport && (
        <div className="modal-backdrop" onClick={() => !clinicalSubmitting && setClinicalModalReport(null)}>
          <div className="modal-card" style={{ maxWidth: "500px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "0.5px" }}>
                  CLINICAL RECOVERY & VETERINARY CARE
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  Record Care for #{String(clinicalModalReport.id).padStart(4, "0")} ({clinicalModalReport.animalName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClinicalModalReport(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleClinicalSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                  Recovery Phase Status <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  required
                  value={clinicalStatus}
                  onChange={(e) => setClinicalStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "13px",
                    color: "#263b31",
                    background: "#ffffff",
                    fontWeight: "600",
                  }}
                >
                  <option value="UNDER_TREATMENT">UNDER TREATMENT (In Clinic / Surgery / Dressing)</option>
                  <option value="RECOVERED">RECOVERED (Fully Healed / Safe)</option>
                  <option value="RESCUED">RESCUED (Secured from Field)</option>
                  <option value="LISTED_FOR_ADOPTION">LISTED FOR ADOPTION (Ready for New Home)</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                  Clinical / Veterinary Treatment Notes <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="e.g. Admitted to clinic. Administered antibiotic and pain injection. Wound dressed and animal stabilizing."
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setClinicalModalReport(null)}
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
                  disabled={clinicalSubmitting || !clinicalNote.trim()}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: clinicalSubmitting || !clinicalNote.trim() ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Stethoscope size={14} />
                  <span>{clinicalSubmitting ? "Saving Log..." : "Save Clinical Log"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: Rescue Operation Audit & Timeline Modal
          ========================================================================= */}
      {viewingTimelineReport && (
        <div className="modal-backdrop" onClick={() => setViewingTimelineReport(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "640px", background: "#ffffff", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #eef2ee", paddingBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#1b7a43", letterSpacing: "0.5px" }}>
                  RESCUE OPERATION AUDIT & TIMELINE
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  {viewingTimelineReport.animalName} (#AR-{String(viewingTimelineReport.id).padStart(4, "0")})
                </h2>
                <div style={{ fontSize: "12px", color: "#61776b", marginTop: "2px" }}>
                  {viewingTimelineReport.animalType} &middot; Priority: <b>{viewingTimelineReport.severity}</b> &middot; Status: <b>{viewingTimelineReport.status}</b>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTimelineReport(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Assignment Particulars Box */}
            <div
              style={{
                background: "#f4fbf6",
                borderRadius: "10px",
                border: "1px solid #c8ded0",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={16} color="#1b7a43" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#1b7a43" }}>
                    Assignment & Dispatch Particulars
                  </span>
                </div>
                {getActiveAssignment(viewingTimelineReport) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchModalReport(viewingTimelineReport);
                      setDispatchVolunteerId("");
                      setDispatchNotes("");
                    }}
                    style={{
                      background: "#e8f5ec",
                      border: "1px solid #c9e4d1",
                      color: "#166534",
                      padding: "3px 8px",
                      borderRadius: "5px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <RefreshCw size={11} />
                    <span>Reassign Volunteer</span>
                  </button>
                )}
              </div>

              {(() => {
                const activeAssigned = getActiveAssignment(viewingTimelineReport);
                if (activeAssigned) {
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>ACTIVE VOLUNTEER</div>
                        <div style={{ fontWeight: "700", color: "#263b31", marginTop: "2px" }}>
                          {activeAssigned.volunteerName}
                        </div>
                        {activeAssigned.volunteerPhone && (
                          <div style={{ fontSize: "12px", color: "#1b7a43", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Phone size={11} />
                            <a href={`tel:${activeAssigned.volunteerPhone}`} style={{ color: "#1b7a43", textDecoration: "none", fontWeight: "600" }}>
                              {activeAssigned.volunteerPhone}
                            </a>
                          </div>
                        )}
                        {activeAssigned.volunteerEmail && (
                          <div style={{ fontSize: "11px", color: "#61776b" }}>{activeAssigned.volunteerEmail}</div>
                        )}
                      </div>

                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>ASSIGNED BY</div>
                        <div style={{ fontWeight: "700", color: "#263b31", marginTop: "2px" }}>
                          {activeAssigned.assignedByName || "System Administrator"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#61776b" }}>Rescue Center Authority</div>
                      </div>

                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>DISPATCH TIMESTAMP</div>
                        <div style={{ fontWeight: "700", color: "#166534", marginTop: "2px" }}>
                          {formatDate(activeAssigned.assignedAt)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#059669" }}>
                          When volunteer went for rescue ({timeAgo(activeAssigned.assignedAt)})
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>DISPATCH INSTRUCTIONS</div>
                        <div style={{ color: "#374151", marginTop: "2px" }}>
                          {activeAssigned.notes || "Standard emergency rescue dispatch"}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div style={{ color: "#b45309", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                      Case is currently unassigned (No volunteer dispatched yet).
                    </div>
                    <button
                      onClick={() => {
                        setDispatchModalReport(viewingTimelineReport);
                        setDispatchVolunteerId("");
                        setDispatchNotes("");
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: "#1b7a43",
                        color: "#fff",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <UserPlus size={13} />
                      <span>Dispatch Volunteer Now</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Visual Milestones Stepper */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#263b31", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} color="#1b7a43" />
                <span>Complete Rescue Operation & Clinical Milestones</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative", paddingLeft: "16px", borderLeft: "2px solid #e1ece3" }}>
                {/* Step 1: Ingestion */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "-22px", top: "2px", width: "10px", height: "10px", borderRadius: "50%", background: "#1b7a43" }}></div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#263b31" }}>
                    Distress Incident Reported
                  </div>
                  <div style={{ fontSize: "11px", color: "#61776b" }}>
                    {formatDate(viewingTimelineReport.createdAt)} &middot; Reporter: <b>{viewingTimelineReport.reporterName || "Citizen"}</b>
                  </div>
                  {viewingTimelineReport.description && (
                    <div style={{ fontSize: "12px", color: "#374151", marginTop: "2px" }}>
                      "{viewingTimelineReport.description}"
                    </div>
                  )}
                </div>

                {/* Status history log items */}
                {viewingTimelineReport.statusHistories?.map((log, idx) => {
                  const isRescue = log.newStatus === "RESCUED";
                  const isClinic = log.newStatus === "UNDER_TREATMENT";
                  const isRecovered = log.newStatus === "RECOVERED" || log.newStatus === "ADOPTED";

                  return (
                    <div key={log.id || idx} style={{ position: "relative", marginTop: "6px" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: "-22px",
                          top: "2px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: isRecovered ? "#166534" : isClinic ? "#2563eb" : isRescue ? "#059669" : "#94a3b8",
                        }}
                      ></div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: isRecovered ? "#166534" : isClinic ? "#2563eb" : "#059669" }}>
                        Transitioned to: {log.newStatus.replace(/_/g, " ")}
                      </div>
                      <div style={{ fontSize: "11px", color: "#61776b" }}>
                        {formatDate(log.changedAt)} &middot; Action logged by: <b>{log.changedByName || "System Authority"}</b>
                      </div>
                      {log.note && (
                        <div style={{ fontSize: "12px", color: "#374151", marginTop: "2px", background: "#f8faf8", padding: "4px 8px", borderRadius: "4px" }}>
                          "{log.note}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setClinicalModalReport(viewingTimelineReport);
                  setClinicalStatus(viewingTimelineReport.status === "RESCUED" ? "UNDER_TREATMENT" : viewingTimelineReport.status);
                  setClinicalNote("");
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Stethoscope size={13} />
                <span>Add Clinical Note</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingTimelineReport(null)}
                style={{ padding: "8px 18px", borderRadius: "6px", background: "#1b7a43", color: "#fff", border: "none", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
