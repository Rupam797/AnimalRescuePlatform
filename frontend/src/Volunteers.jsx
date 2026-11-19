import { useEffect, useState } from "react";
import "./Volunteers.css";
import { adminService } from "./services/api";
import { Check, Clock, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadVolunteers() {
      try {
        setLoading(true);
        setError("");
        const res = await adminService.getVolunteers();
        if (!cancelled) {
          setVolunteers(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load volunteers.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVolunteers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleApprove(id, name) {
    try {
      setUpdatingId(id);
      setError("");
      setMessage("");

      const res = await adminService.approveVolunteer(id);
      setVolunteers((current) => current.map((v) => (v.id === id ? res.data : v)));
      setMessage(`Volunteer ${name} has been approved and can now access the dispatch system!`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to approve volunteer.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleStatus(id, currentEnabled) {
    try {
      setUpdatingId(id);
      setError("");
      setMessage("");

      const res = await adminService.disableUser(id, currentEnabled);
      setVolunteers((current) => current.map((v) => (v.id === id ? res.data : v)));
      setMessage(`Volunteer status updated.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to toggle volunteer status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="volunteers-page">
      <div className="volunteers-header">
        <div>
          <div className="volunteers-eyebrow">PAWRESCUE PERSONNEL</div>
          <h1>Volunteer Directory & Approvals</h1>
          <p>Manage rescue volunteers, approve new volunteer registrations, and track field availability.</p>
        </div>
        <span className="volunteers-total">{volunteers.length} registered volunteers</span>
      </div>

      {message && (
        <div className="volunteers-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="volunteers-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      <div className="volunteers-card">
        {loading ? (
          <div className="state-empty">Loading volunteers...</div>
        ) : volunteers.length === 0 ? (
          <div className="state-empty">No volunteers registered yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="volunteers-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>Approval Status</th>
                  <th>Account</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((vol) => (
                  <tr key={vol.id}>
                    <td>
                      <div className="volunteer-name-cell">
                        <span className="avatar-circle">
                          {vol.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{vol.name}</strong>
                          <div style={{ fontSize: "11px", color: "#61776b" }}>Rescue Field Agent</div>
                        </div>
                      </div>
                    </td>
                    <td>{vol.email}</td>
                    <td>{vol.phone || "—"}</td>
                    <td>
                      {vol.approved ? (
                        <span
                          style={{
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Check size={12} />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock size={12} />
                          <span>Pending Approval</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          background: vol.enabled ? "#e8f5ec" : "#fef2f2",
                          color: vol.enabled ? "#1b7a43" : "#991b1b",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {vol.enabled ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>{formatDate(vol.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {!vol.approved && (
                          <button
                            type="button"
                            disabled={updatingId === vol.id}
                            onClick={() => handleApprove(vol.id, vol.name)}
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
                              gap: "4px",
                            }}
                          >
                            <UserCheck size={12} />
                            <span>Approve</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === vol.id}
                          onClick={() => handleToggleStatus(vol.id, vol.enabled)}
                          style={{
                            background: "transparent",
                            border: "1px solid #d4dfd7",
                            color: vol.enabled ? "#b91c1c" : "#1b7a43",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          {vol.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
