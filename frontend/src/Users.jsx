import { useEffect, useState } from "react";
import "./Users.css";
import { adminService } from "./services/api";
import { CheckCircle2, AlertCircle, Search, UserCheck, UserX } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminService.getUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load platform users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggle(user) {
    try {
      setUpdatingId(user.id);
      setError("");
      setMessage("");

      const res = await adminService.disableUser(user.id, user.enabled);
      setUsers((current) => current.map((u) => (u.id === user.id ? res.data : u)));
      setMessage(`User account ${user.enabled ? "deactivated" : "reactivated"}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  return (
    <section className="users-page">
      <div className="users-header">
        <div>
          <div className="users-eyebrow">PAWRESCUE DIRECTORY</div>
          <h1>Platform Users</h1>
          <p>View registered community citizens, adopters, rescue volunteers, and platform accounts.</p>
        </div>
        <span className="users-total">{users.length} registered accounts</span>
      </div>

      {message && (
        <div className="users-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="users-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      <div className="users-card">
        <div className="users-toolbar">
          <input
            type="search"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="state-empty">Loading platform users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="state-empty">No users found matching your search.</div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isAdminUser = user.role === "ROLE_ADMIN";

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <span
                            className="avatar-circle"
                            style={{
                              background: isAdminUser ? "#1b7a43" : user.role === "ROLE_VOLUNTEER" ? "#e9b46b" : "#76bb82",
                            }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{user.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td>
                        <span
                          style={{
                            background: isAdminUser ? "#e8f5ec" : user.role === "ROLE_VOLUNTEER" ? "#fef3c7" : "#eff6ff",
                            color: isAdminUser ? "#1b7a43" : user.role === "ROLE_VOLUNTEER" ? "#92400e" : "#1d4ed8",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {user.role.replace("ROLE_", "")}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: user.enabled ? "#e8f5ec" : "#fef2f2",
                            color: user.enabled ? "#1b7a43" : "#991b1b",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {user.enabled ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        {!isAdminUser && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => handleToggle(user)}
                            style={{
                              background: "transparent",
                              border: "1px solid #d4dfd7",
                              color: user.enabled ? "#b91c1c" : "#1b7a43",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {user.enabled ? <UserX size={12} /> : <UserCheck size={12} />}
                            <span>{user.enabled ? "Disable" : "Enable"}</span>
                          </button>
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
