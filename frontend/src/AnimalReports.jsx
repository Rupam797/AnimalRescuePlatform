import { useEffect, useState } from "react";
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
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function AnimalReports() {
  const [reports, setReports] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [viewingMapReport, setViewingMapReport] = useState(null);

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

  async function updateStatus(report, newStatus) {
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
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAssign(reportId) {
    if (!selectedVolunteerId) return;
    try {
      setUpdatingId(reportId);
      const res = await reportService.assignVolunteer(reportId, {
        volunteerId: Number(selectedVolunteerId),
        notes: "Assigned by admin",
      });
      setReports((current) => current.map((r) => (r.id === res.data.id ? res.data : r)));
      setMessage(`Volunteer assigned to case #${reportId}!`);
      setAssigningId(null);
      setSelectedVolunteerId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign volunteer.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredReports = reports.filter((report) => {
    const query = search.trim().toLowerCase();
    return [
      report.animalName,
      report.animalType,
      report.address,
      report.landmark,
      report.status,
      String(report.id),
      report.severity,
    ].some((value) => String(value ?? "").toLowerCase().includes(query));
  });

  function getImageUrl(images) {
    if (!images || images.length === 0) return null;
    const path = images[0];
    return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  }

  return (
    <section className="animal-reports-page">
      <div className="animal-reports-heading">
        <div>
          <div className="animal-reports-eyebrow">PAWRESCUE MANAGEMENT</div>
          <h1>Animal Reports & Dispatch</h1>
          <p>Review distress reports, inspect GPS locations, assign rescue volunteers, and track clinical recovery.</p>
        </div>
        <span className="animal-reports-total">{reports.length} total reports</span>
      </div>

      <div className="animal-report-summary">
        <article>
          <span>Total reports</span>
          <strong>{reports.length}</strong>
        </article>
        <article>
          <span>Reported / Pending</span>
          <strong>{reports.filter((r) => r.status === "REPORTED").length}</strong>
        </article>
        <article>
          <span>In Treatment</span>
          <strong>{reports.filter((r) => r.status === "UNDER_TREATMENT").length}</strong>
        </article>
        <article>
          <span>Recovered</span>
          <strong>{reports.filter((r) => ["RECOVERED", "LISTED_FOR_ADOPTION", "ADOPTED"].includes(r.status)).length}</strong>
        </article>
      </div>

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

      <div className="animal-reports-card">
        <div className="animal-reports-toolbar">
          <input
            type="search"
            placeholder="Search by animal name, type, location, severity or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="animal-reports-state">Loading reports from database...</div>
        ) : filteredReports.length === 0 ? (
          <div className="animal-reports-state">No animal reports found matching your search.</div>
        ) : (
          <div className="table-responsive">
            <table className="animal-reports-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Animal</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Location & Map</th>
                  <th>Assigned Volunteer</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const imageSrc = getImageUrl(report.images);
                  const isAssigned = report.assignments && report.assignments.length > 0;
                  const assignedVol = isAssigned ? report.assignments[0] : null;

                  return (
                    <tr key={report.id}>
                      <td>
                        <strong>#AR-{String(report.id).padStart(4, "0")}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={report.animalName}
                              style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#eef3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <PawPrint size={18} color="#94a3b8" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700" }}>{report.animalName || "Unknown"}</div>
                            <div style={{ fontSize: "11px", color: "#61776b" }}>{report.description ? report.description.slice(0, 36) + "..." : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td>{report.animalType}</td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: report.severity === "CRITICAL" ? "#fef2f2" : report.severity === "MEDIUM" ? "#fef9ee" : "#ecfdf5",
                            color: report.severity === "CRITICAL" ? "#c81e1e" : report.severity === "MEDIUM" ? "#b45309" : "#047857",
                          }}
                        >
                          {report.severity}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "13px" }}>{report.address || "No address detected"}</div>
                        <button
                          type="button"
                          onClick={() => setViewingMapReport(report)}
                          style={{
                            marginTop: "4px",
                            background: "#e8f5ec",
                            color: "#1b7a43",
                            border: "1px solid #c9e4d1",
                            padding: "3px 8px",
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
                          <span>View Map Pin</span>
                        </button>
                      </td>
                      <td>
                        {assignedVol ? (
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1b7a43" }}>
                            {assignedVol.volunteerName}
                          </div>
                        ) : assigningId === report.id ? (
                          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <select
                              value={selectedVolunteerId}
                              onChange={(e) => setSelectedVolunteerId(e.target.value)}
                              style={{ padding: "4px 6px", borderRadius: "6px", fontSize: "12px", border: "1px solid #d4dfd7" }}
                            >
                              <option value="">Select volunteer</option>
                              {volunteers.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(report.id)}
                              style={{ padding: "4px 8px", borderRadius: "6px", background: "#1b7a43", color: "#fff", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setAssigningId(null)}
                              style={{ padding: "4px 6px", borderRadius: "6px", background: "#e5e7eb", border: "none", fontSize: "11px", cursor: "pointer", display: "flex" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAssigningId(report.id);
                              setSelectedVolunteerId("");
                            }}
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
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
                            <UserPlus size={12} />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>
                      <td>
                        <select
                          className="status-dropdown"
                          value={report.status}
                          disabled={updatingId === report.id}
                          onChange={(e) => updateStatus(report, e.target.value)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: "#ffffff",
                            border: "1px solid #d4dfd7",
                          }}
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewingMapReport(report)}
                          style={{
                            background: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            color: "#374151",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Map & Report Detail Modal */}
      {viewingMapReport && (
        <div className="modal-backdrop" onClick={() => setViewingMapReport(null)}>
          <div className="modal-card" style={{ maxWidth: "540px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: 0 }}>
                {viewingMapReport.animalName} (#AR-{String(viewingMapReport.id).padStart(4, "0")})
              </h3>
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
              height="230px"
            />

            <div style={{ marginTop: "14px", fontSize: "13px", lineHeight: "1.6", color: "#263b31" }}>
              <div><b>Address:</b> {viewingMapReport.address || "Not detected"}</div>
              {viewingMapReport.landmark && <div><b>Landmark:</b> {viewingMapReport.landmark}</div>}
              <div><b>Condition:</b> {viewingMapReport.description}</div>
              {viewingMapReport.contactPhone && <div><b>Reporter Phone:</b> {viewingMapReport.contactPhone}</div>}
              <div><b>Status:</b> {viewingMapReport.status.replace(/_/g, " ")}</div>
            </div>

            <div style={{ marginTop: "18px", textAlign: "right" }}>
              <button
                onClick={() => setViewingMapReport(null)}
                style={{ padding: "7px 16px", borderRadius: "6px", background: "#1b7a43", color: "#fff", border: "none", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
