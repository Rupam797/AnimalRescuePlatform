import { useEffect, useState } from "react";
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

export default function RescueCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingMapCase, setViewingMapCase] = useState(null);

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

  async function assignVolunteer(reportId) {
    if (!selectedVolunteerId) return;

    try {
      setUpdatingId(reportId);
      setError("");
      setMessage("");

      const res = await reportService.assignVolunteer(reportId, {
        volunteerId: Number(selectedVolunteerId),
        notes: "Assigned via Rescue Cases admin view",
      });

      setCases((current) => current.map((c) => (c.id === res.data.id ? res.data : c)));
      setMessage(`Volunteer assigned successfully to Case #${reportId}!`);
      setAssigningId(null);
      setSelectedVolunteerId("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign volunteer.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateStatus(report, newStatus) {
    try {
      setUpdatingId(report.id);
      setError("");
      setMessage("");

      const res = await reportService.updateStatus(report.id, {
        status: newStatus,
        note: `Status updated by Admin in Rescue Cases`,
      });

      setCases((current) => current.map((c) => (c.id === res.data.id ? res.data : c)));
      setMessage(`${res.data.animalName}'s status is now ${res.data.status}.`);
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

  return (
    <section className="rescue-cases-page">
      <div className="rescue-cases-header">
        <div>
          <div className="rescue-cases-eyebrow">PAWRESCUE DISPATCH</div>
          <h1>Rescue Cases</h1>
          <p>Coordinate active field rescues, review incident reports, and assign volunteers.</p>
        </div>
        <button
          type="button"
          className="refresh-button"
          onClick={() => setRefreshKey((k) => k + 1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={13} />
          <span>Refresh Cases</span>
        </button>
      </div>

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

      <div className="rescue-cases-card">
        {loading ? (
          <div className="state-empty">Loading rescue operations...</div>
        ) : cases.length === 0 ? (
          <div className="state-empty">No rescue cases recorded yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="rescue-cases-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Animal</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Reported At</th>
                  <th>Status</th>
                  <th>Assigned Volunteer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => {
                  const imageSrc = getImageUrl(item.images);
                  const isAssigned = item.assignments && item.assignments.length > 0;
                  const assignedVol = isAssigned ? item.assignments[0] : null;

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>#AR-{String(item.id).padStart(4, "0")}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.animalName}
                              style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#eef3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <PawPrint size={18} color="#94a3b8" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700" }}>{item.animalName}</div>
                            <div style={{ fontSize: "11px", color: "#61776b" }}>{item.animalType}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "13px" }}>{item.address || `${item.latitude}, ${item.longitude}`}</div>
                        <button
                          type="button"
                          onClick={() => setViewingMapCase(item)}
                          style={{
                            marginTop: "3px",
                            background: "transparent",
                            border: "none",
                            color: "#1b7a43",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <MapPin size={11} />
                          <span>Map Pin</span>
                        </button>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: item.severity === "CRITICAL" ? "#fef2f2" : item.severity === "MEDIUM" ? "#fef9ee" : "#ecfdf5",
                            color: item.severity === "CRITICAL" ? "#c81e1e" : item.severity === "MEDIUM" ? "#b45309" : "#047857",
                          }}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(e) => updateStatus(item, e.target.value)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            border: "1px solid #d4dfd7",
                            background: "#ffffff",
                          }}
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {assignedVol ? (
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1b7a43" }}>
                            {assignedVol.volunteerName}
                          </div>
                        ) : assigningId === item.id ? (
                          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <select
                              value={selectedVolunteerId}
                              onChange={(e) => setSelectedVolunteerId(e.target.value)}
                              style={{ padding: "4px 6px", borderRadius: "6px", fontSize: "12px", border: "1px solid #d4dfd7" }}
                            >
                              <option value="">Choose volunteer</option>
                              {volunteers.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => assignVolunteer(item.id)}
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
                              setAssigningId(item.id);
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
                        <button
                          type="button"
                          onClick={() => setViewingMapCase(item)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #d4dfd7",
                            background: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          View Map
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

      {viewingMapCase && (
        <div className="modal-backdrop" onClick={() => setViewingMapCase(null)}>
          <div className="modal-card" style={{ maxWidth: "540px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: 0 }}>
                {viewingMapCase.animalName} (#AR-{String(viewingMapCase.id).padStart(4, "0")})
              </h3>
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
              height="230px"
            />

            <div style={{ marginTop: "14px", fontSize: "13px", lineHeight: "1.6", color: "#263b31" }}>
              <div><b>Address:</b> {viewingMapCase.address}</div>
              {viewingMapCase.landmark && <div><b>Landmark:</b> {viewingMapCase.landmark}</div>}
              <div><b>Condition:</b> {viewingMapCase.description}</div>
            </div>

            <div style={{ marginTop: "18px", textAlign: "right" }}>
              <button
                onClick={() => setViewingMapCase(null)}
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
