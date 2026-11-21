import { useEffect, useState, useMemo } from "react";
import "./RescueCases.css";
import { reportService, adminService, BACKEND_URL } from "./services/api";
import MapView from "./components/MapView";
import {
  PawPrint,
  MapPin,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Clock,
  Ambulance,
  Calendar,
  Check,
  User,
  Shield,
  FileText,
  Search,
  Filter,
  ExternalLink,
  Navigation,
  Stethoscope,
  Phone,
  Mail,
  ArrowRight,
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

export default function RescueCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [volunteerFilter, setVolunteerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Modals
  const [viewingMapCase, setViewingMapCase] = useState(null);
  const [viewingTimelineCase, setViewingTimelineCase] = useState(null);
  const [dispatchModalCase, setDispatchModalCase] = useState(null);
  const [clinicalModalCase, setClinicalModalCase] = useState(null);

  // Dispatch modal form
  const [dispatchVolunteerId, setDispatchVolunteerId] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  // Clinical note modal form
  const [clinicalStatus, setClinicalStatus] = useState("UNDER_TREATMENT");
  const [clinicalNote, setClinicalNote] = useState("");
  const [clinicalSubmitting, setClinicalSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [reportsRes, volRes] = await Promise.all([
          reportService.getAll(),
          adminService.getVolunteers(),
        ]);

        if (!cancelled) {
          setCases(reportsRes.data);
          setVolunteers(volRes.data.filter((v) => v.approved));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load rescue cases.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Handle Volunteer Dispatch / Reassignment
  async function handleDispatchSubmit(e) {
    if (e) e.preventDefault();
    if (!dispatchModalCase || !dispatchVolunteerId) return;

    try {
      setDispatchSubmitting(true);
      setError("");
      setMessage("");

      const res = await reportService.assignVolunteer(dispatchModalCase.id, {
        volunteerId: Number(dispatchVolunteerId),
        notes: dispatchNotes.trim() || "Assigned via Rescue Operations Dispatch",
      });

      setCases((current) => current.map((c) => (c.id === res.data.id ? res.data : c)));
      setMessage(`Volunteer successfully assigned to Case #${dispatchModalCase.id}!`);
      
      if (viewingTimelineCase && viewingTimelineCase.id === dispatchModalCase.id) {
        setViewingTimelineCase(res.data);
      }

      setDispatchModalCase(null);
      setDispatchVolunteerId("");
      setDispatchNotes("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign volunteer.");
    } finally {
      setDispatchSubmitting(false);
    }
  }

  // Handle Clinical Recovery / Treatment Status Update
  async function handleClinicalSubmit(e) {
    if (e) e.preventDefault();
    if (!clinicalModalCase) return;

    try {
      setClinicalSubmitting(true);
      setError("");
      setMessage("");

      const res = await reportService.updateStatus(clinicalModalCase.id, {
        status: clinicalStatus,
        note: clinicalNote.trim() || `Clinical status changed to ${clinicalStatus}`,
      });

      setCases((current) => current.map((c) => (c.id === res.data.id ? res.data : c)));
      setMessage(`Clinical recovery log saved for Case #${clinicalModalCase.id}!`);

      if (viewingTimelineCase && viewingTimelineCase.id === clinicalModalCase.id) {
        setViewingTimelineCase(res.data);
      }

      setClinicalModalCase(null);
      setClinicalNote("");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setClinicalSubmitting(false);
    }
  }

  // Direct status dropdown update
  async function handleInlineStatusUpdate(item, newStatus) {
    try {
      setUpdatingId(item.id);
      setError("");
      setMessage("");

      const res = await reportService.updateStatus(item.id, {
        status: newStatus,
        note: `Status updated to ${newStatus} by admin`,
      });

      setCases((current) => current.map((c) => (c.id === res.data.id ? res.data : c)));
      setMessage(`${res.data.animalName}'s status is now ${res.data.status}.`);

      if (viewingTimelineCase && viewingTimelineCase.id === item.id) {
        setViewingTimelineCase(res.data);
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

  // Filter logic
  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      // Search query
      const query = search.trim().toLowerCase();
      if (query) {
        const hasMatch = [
          item.animalName,
          item.animalType,
          item.address,
          item.landmark,
          item.status,
          item.severity,
          `#ar-${String(item.id).padStart(4, "0")}`,
          String(item.id),
          item.reporterName,
          ...(item.assignments || []).map((a) => a.volunteerName),
          ...(item.assignments || []).map((a) => a.assignedByName),
        ].some((v) => String(v ?? "").toLowerCase().includes(query));

        if (!hasMatch) return false;
      }

      // Volunteer filter
      if (volunteerFilter === "UNASSIGNED") {
        if (item.assignments && item.assignments.length > 0) return false;
      } else if (volunteerFilter === "ASSIGNED") {
        if (!item.assignments || item.assignments.length === 0) return false;
      } else if (volunteerFilter !== "ALL") {
        const volId = Number(volunteerFilter);
        const isMatched = item.assignments?.some((a) => a.volunteerId === volId);
        if (!isMatched) return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE") {
        if (!["ASSIGNED", "RESCUED"].includes(item.status)) return false;
      } else if (statusFilter === "CLINIC") {
        if (item.status !== "UNDER_TREATMENT") return false;
      } else if (statusFilter === "RECOVERED") {
        if (!["RECOVERED", "LISTED_FOR_ADOPTION", "ADOPTED"].includes(item.status)) return false;
      } else if (statusFilter === "NEEDS_DISPATCH") {
        if (item.status !== "REPORTED" || (item.assignments && item.assignments.length > 0)) return false;
      } else if (statusFilter !== "ALL") {
        if (item.status !== statusFilter) return false;
      }

      // Severity filter
      if (severityFilter !== "ALL" && item.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [cases, search, volunteerFilter, statusFilter, severityFilter]);

  // Statistics
  const totalCount = cases.length;
  const activeDispatches = cases.filter((c) => ["ASSIGNED", "RESCUED"].includes(c.status)).length;
  const inClinic = cases.filter((c) => c.status === "UNDER_TREATMENT").length;
  const recoveredCount = cases.filter((c) => ["RECOVERED", "LISTED_FOR_ADOPTION", "ADOPTED"].includes(c.status)).length;
  const unassignedCount = cases.filter((c) => !c.assignments || c.assignments.length === 0).length;

  return (
    <section className="rescue-cases-page">
      {/* Page Heading */}
      <div className="rescue-cases-heading">
        <div>
          <div className="rescue-cases-eyebrow">PAWRESCUE FIELD DISPATCH</div>
          <h1>Rescue Cases & Field Operations</h1>
          <p>
            Track which volunteer went for rescue, who dispatched them, inspect GPS distress locations, and monitor clinical recovery.
          </p>
        </div>
        <button
          type="button"
          className="refresh-button"
          onClick={() => setRefreshKey((k) => k + 1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={13} />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* KPI Overview Summary */}
      <div className="rescue-summary-grid">
        <div className="rescue-summary-card">
          <p>Total Rescue Cases</p>
          <strong>{totalCount}</strong>
          <div style={{ fontSize: "11px", color: "#61776b", marginTop: "4px" }}>
            {unassignedCount} awaiting volunteer dispatch
          </div>
        </div>

        <div className="rescue-summary-card">
          <p>Active Field Rescues</p>
          <strong style={{ color: "#b45309" }}>{activeDispatches}</strong>
          <div style={{ fontSize: "11px", color: "#b45309", marginTop: "4px" }}>
            Volunteer en route / secured
          </div>
        </div>

        <div className="rescue-summary-card">
          <p>Under Clinical Recovery</p>
          <strong style={{ color: "#2563eb" }}>{inClinic}</strong>
          <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "4px" }}>
            Veterinary care & treatment
          </div>
        </div>

        <div className="rescue-summary-card">
          <p>Recovered & Safe</p>
          <strong style={{ color: "#166534" }}>{recoveredCount}</strong>
          <div style={{ fontSize: "11px", color: "#166534", marginTop: "4px" }}>
            Healed / Ready for adoption
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className="rescue-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="rescue-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Card with Advanced Filters */}
      <div className="rescue-cases-card">
        {/* Filters & Search Toolbar */}
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
              placeholder="Search by animal, #AR ID, address, volunteer name, dispatcher..."
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

          {/* Filter Dropdowns */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Volunteer Filter */}
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
                <option value="ALL">All Volunteers (All Cases)</option>
                <option value="UNASSIGNED">Only Unassigned Cases</option>
                <option value="ASSIGNED">Only Assigned Cases</option>
                <optgroup label="Filter by Specific Volunteer">
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Volunteer)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Stage / Status Filter */}
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
              <option value="ACTIVE">Active Field Rescues</option>
              <option value="CLINIC">Under Clinical Care</option>
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

        {/* Content Table */}
        {loading ? (
          <div className="state-empty">Loading rescue operations from database...</div>
        ) : filteredCases.length === 0 ? (
          <div className="state-empty">
            <PawPrint size={32} color="#94a3b8" style={{ marginBottom: "8px" }} />
            <div>No rescue cases match your active filters.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="rescue-cases-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Animal & Distress Info</th>
                  <th>Location & GPS</th>
                  <th>Priority</th>
                  <th>Assigned Volunteer & Dispatcher</th>
                  <th>Clinical & Field Status</th>
                  <th>Reported</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((item) => {
                  const imageSrc = getImageUrl(item.images);
                  const isAssigned = item.assignments && item.assignments.length > 0;
                  const assignedVol = isAssigned ? item.assignments[item.assignments.length - 1] : null;
                  const rescueLog = item.statusHistories?.find((h) => h.newStatus === "RESCUED");
                  const treatmentLog = item.statusHistories?.find((h) => h.newStatus === "UNDER_TREATMENT");

                  return (
                    <tr key={item.id}>
                      {/* Case ID */}
                      <td>
                        <strong>#AR-{String(item.id).padStart(4, "0")}</strong>
                      </td>

                      {/* Animal details */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.animalName}
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
                            <div style={{ fontWeight: "700", color: "#263b31" }}>{item.animalName}</div>
                            <div style={{ fontSize: "11px", color: "#61776b" }}>{item.animalType}</div>
                            {item.description && (
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
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location & GPS */}
                      <td>
                        <div style={{ fontSize: "12px", color: "#263b31", fontWeight: "600", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.address || "GPS Position"}
                        </div>
                        {item.landmark && (
                          <div style={{ fontSize: "11px", color: "#61776b" }}>
                            Near: {item.landmark}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <button
                            type="button"
                            onClick={() => setViewingMapCase(item)}
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

                          {item.latitude && item.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
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
                              title="Navigate via Google Maps"
                            >
                              <Navigation size={10} />
                              <span>Route</span>
                            </a>
                          )}
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
                              item.severity === "CRITICAL"
                                ? "#fef2f2"
                                : item.severity === "HIGH"
                                ? "#fff7ed"
                                : item.severity === "MEDIUM"
                                ? "#fefce8"
                                : "#ecfdf5",
                            color:
                              item.severity === "CRITICAL"
                                ? "#b91c1c"
                                : item.severity === "HIGH"
                                ? "#c2410c"
                                : item.severity === "MEDIUM"
                                ? "#a16207"
                                : "#047857",
                            border: `1px solid ${
                              item.severity === "CRITICAL"
                                ? "#fecaca"
                                : item.severity === "HIGH"
                                ? "#ffedd5"
                                : item.severity === "MEDIUM"
                                ? "#fef08a"
                                : "#a7f3d0"
                            }`,
                          }}
                        >
                          {item.severity}
                        </span>
                      </td>

                      {/* Which Volunteer Went for Rescue & Who Assigned */}
                      <td>
                        {assignedVol ? (
                          <div style={{ maxWidth: "220px" }}>
                            {/* Volunteer Name */}
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Ambulance size={14} color="#1b7a43" />
                              <strong style={{ fontSize: "13px", color: "#166534" }}>
                                {assignedVol.volunteerName}
                              </strong>
                            </div>

                            {/* Volunteer Contact */}
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

                            {/* Who assigned & When */}
                            <div style={{ fontSize: "11px", color: "#61776b", marginTop: "2px" }}>
                              Assigned by: <b>{assignedVol.assignedByName || "System Admin"}</b>
                            </div>
                            <div style={{ fontSize: "10px", color: "#059669", marginTop: "1px" }}>
                              Dispatched: {formatDate(assignedVol.assignedAt)} ({timeAgo(assignedVol.assignedAt)})
                            </div>

                            {/* Reassign Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setDispatchModalCase(item);
                                setDispatchVolunteerId(String(assignedVol.volunteerId || ""));
                                setDispatchNotes(assignedVol.notes || "");
                              }}
                              style={{
                                marginTop: "4px",
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                color: "#166534",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              Reassign / Change
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
                                  setDispatchModalCase(item);
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

                      {/* Clinical Recovery & Field Status */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <select
                            value={item.status}
                            disabled={updatingId === item.id}
                            onChange={(e) => handleInlineStatusUpdate(item, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              border: "1px solid #d4dfd7",
                              background:
                                item.status === "RECOVERED"
                                  ? "#ecfdf5"
                                  : item.status === "UNDER_TREATMENT"
                                  ? "#eff6ff"
                                  : item.status === "RESCUED"
                                  ? "#f0fdf4"
                                  : item.status === "ASSIGNED"
                                  ? "#fffbeb"
                                  : "#ffffff",
                              color:
                                item.status === "RECOVERED"
                                  ? "#047857"
                                  : item.status === "UNDER_TREATMENT"
                                  ? "#1d4ed8"
                                  : item.status === "RESCUED"
                                  ? "#15803d"
                                  : item.status === "ASSIGNED"
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

                          {/* Quick clinical / milestone indicators */}
                          {rescueLog && (
                            <div style={{ fontSize: "10px", color: "#166534", fontWeight: "600" }}>
                              Rescued: {formatDate(rescueLog.changedAt)}
                            </div>
                          )}
                          {treatmentLog && (
                            <div style={{ fontSize: "10px", color: "#2563eb", fontWeight: "600" }}>
                              Treated: {formatDate(treatmentLog.changedAt)}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setClinicalModalCase(item);
                              setClinicalStatus(
                                item.status === "RESCUED"
                                  ? "UNDER_TREATMENT"
                                  : item.status === "UNDER_TREATMENT"
                                  ? "RECOVERED"
                                  : item.status
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
                          {formatDate(item.createdAt)}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                          {timeAgo(item.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setViewingTimelineCase(item)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #c8ded0",
                              background: "#f0fdf4",
                              color: "#166534",
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
                            onClick={() => setViewingMapCase(item)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #d4dfd7",
                              background: "#ffffff",
                              color: "#374151",
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
          MODAL 1: GPS Location & Navigation Modal
          ========================================================================= */}
      {viewingMapCase && (
        <div className="modal-backdrop" onClick={() => setViewingMapCase(null)}>
          <div className="modal-card" style={{ maxWidth: "560px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b7a43", letterSpacing: "0.5px" }}>
                  INSPECT GPS DISTRESS LOCATION
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  {viewingMapCase.animalName} (#AR-{String(viewingMapCase.id).padStart(4, "0")})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingMapCase(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <MapView
              latitude={viewingMapCase.latitude}
              longitude={viewingMapCase.longitude}
              address={viewingMapCase.address}
              height="240px"
            />

            <div style={{ marginTop: "14px", padding: "12px", background: "#f8faf8", borderRadius: "8px", border: "1px solid #e2ebe4", fontSize: "13px", lineHeight: "1.6", color: "#263b31" }}>
              <div><b>Address:</b> {viewingMapCase.address || "No text address"}</div>
              {viewingMapCase.landmark && <div><b>Landmark:</b> {viewingMapCase.landmark}</div>}
              <div>
                <b>GPS Coordinates:</b> {viewingMapCase.latitude}, {viewingMapCase.longitude}
              </div>
              <div><b>Condition:</b> {viewingMapCase.description}</div>
              {viewingMapCase.contactPhone && (
                <div>
                  <b>Reporter Phone:</b>{" "}
                  <a href={`tel:${viewingMapCase.contactPhone}`} style={{ color: "#1b7a43", fontWeight: "700" }}>
                    {viewingMapCase.contactPhone}
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {viewingMapCase.latitude && viewingMapCase.longitude ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${viewingMapCase.latitude},${viewingMapCase.longitude}`}
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
                onClick={() => setViewingMapCase(null)}
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
      {dispatchModalCase && (
        <div className="modal-backdrop" onClick={() => !dispatchSubmitting && setDispatchModalCase(null)}>
          <div className="modal-card" style={{ maxWidth: "500px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b7a43", letterSpacing: "0.5px" }}>
                  RESCUE OPERATIONS DISPATCH
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  Dispatch Volunteer to #{String(dispatchModalCase.id).padStart(4, "0")} ({dispatchModalCase.animalName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalCase(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                  Select Approved Volunteer <span style={{ color: "#dc2626" }}>*</span>
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
                  }}
                >
                  <option value="">Choose an active volunteer...</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} &middot; {v.phone || v.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                  Field Dispatch Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Bring dog crate and muzzle. Reported animal is limping near the tea stall."
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
                  onClick={() => setDispatchModalCase(null)}
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
                  <span>{dispatchSubmitting ? "Dispatching..." : "Confirm Dispatch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Clinical Recovery & Medical Notes Modal
          ========================================================================= */}
      {clinicalModalCase && (
        <div className="modal-backdrop" onClick={() => !clinicalSubmitting && setClinicalModalCase(null)}>
          <div className="modal-card" style={{ maxWidth: "500px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "0.5px" }}>
                  CLINICAL RECOVERY & VETERINARY LOG
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: "2px 0 0" }}>
                  Record Care for #{String(clinicalModalCase.id).padStart(4, "0")} ({clinicalModalCase.animalName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClinicalModalCase(null)}
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
                  placeholder="e.g. Admitted to City Pet Clinic. Administered rabies vaccine, cleaned puncture wound, applied bandage. Diet stabilized."
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
                  onClick={() => setClinicalModalCase(null)}
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
          MODAL 4: Rescue Assignment & Timeline Audit Modal
          ========================================================================= */}
      {viewingTimelineCase && (
        <div className="modal-backdrop" onClick={() => setViewingTimelineCase(null)}>
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
                  {viewingTimelineCase.animalName} (#AR-{String(viewingTimelineCase.id).padStart(4, "0")})
                </h2>
                <div style={{ fontSize: "12px", color: "#61776b", marginTop: "2px" }}>
                  {viewingTimelineCase.animalType} &middot; Priority: <b>{viewingTimelineCase.severity}</b> &middot; Status: <b>{viewingTimelineCase.status}</b>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTimelineCase(null)}
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Shield size={16} color="#1b7a43" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1b7a43" }}>
                  Assignment & Dispatch Particulars
                </span>
              </div>

              {viewingTimelineCase.assignments && viewingTimelineCase.assignments.length > 0 ? (
                (() => {
                  const assignment = viewingTimelineCase.assignments[viewingTimelineCase.assignments.length - 1];
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>ASSIGNED VOLUNTEER</div>
                        <div style={{ fontWeight: "700", color: "#263b31", marginTop: "2px" }}>
                          {assignment.volunteerName}
                        </div>
                        {assignment.volunteerPhone && (
                          <div style={{ fontSize: "12px", color: "#1b7a43", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Phone size={11} />
                            <a href={`tel:${assignment.volunteerPhone}`} style={{ color: "#1b7a43", textDecoration: "none", fontWeight: "600" }}>
                              {assignment.volunteerPhone}
                            </a>
                          </div>
                        )}
                        {assignment.volunteerEmail && (
                          <div style={{ fontSize: "11px", color: "#61776b" }}>{assignment.volunteerEmail}</div>
                        )}
                      </div>

                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>ASSIGNED BY</div>
                        <div style={{ fontWeight: "700", color: "#263b31", marginTop: "2px" }}>
                          {assignment.assignedByName || "System Administrator"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#61776b" }}>Rescue Center Authority</div>
                      </div>

                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>DISPATCH TIMESTAMP</div>
                        <div style={{ fontWeight: "700", color: "#166534", marginTop: "2px" }}>
                          {formatDate(assignment.assignedAt)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#059669" }}>
                          When volunteer went for rescue ({timeAgo(assignment.assignedAt)})
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#61776b", fontSize: "11px", fontWeight: "700" }}>DISPATCH INSTRUCTIONS</div>
                        <div style={{ color: "#374151", marginTop: "2px" }}>
                          {assignment.notes || "Standard emergency rescue dispatch"}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <div style={{ color: "#b45309", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                    Case is currently unassigned (No volunteer dispatched yet).
                  </div>
                  <button
                    onClick={() => {
                      setDispatchModalCase(viewingTimelineCase);
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
              )}
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
                    {formatDate(viewingTimelineCase.createdAt)} &middot; Reporter: <b>{viewingTimelineCase.reporterName || "Citizen"}</b>
                  </div>
                  {viewingTimelineCase.description && (
                    <div style={{ fontSize: "12px", color: "#374151", marginTop: "2px" }}>
                      "{viewingTimelineCase.description}"
                    </div>
                  )}
                </div>

                {/* Status history log items */}
                {viewingTimelineCase.statusHistories?.map((log, idx) => {
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

            {/* Modal Close Button */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setClinicalModalCase(viewingTimelineCase);
                  setClinicalStatus(viewingTimelineCase.status === "RESCUED" ? "UNDER_TREATMENT" : viewingTimelineCase.status);
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
                onClick={() => setViewingTimelineCase(null)}
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
