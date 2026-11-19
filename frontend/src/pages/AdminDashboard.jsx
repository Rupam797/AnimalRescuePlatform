import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdoptionRequests from "../AdoptionRequests";
import RescueCases from "../RescueCases";
import Volunteers from "../Volunteers";
import AnimalReports from "../AnimalReports";
import Users from "../Users";
import NotificationBell from "../NotificationBell";
import { adminService, reportService, adoptionService, BACKEND_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../App.css";
import {
  LayoutDashboard,
  FileText,
  Heart,
  Shield,
  Home as HomeIcon,
  Users as UsersIcon,
  PawPrint,
  Search,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Plus,
  ArrowRight,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("Dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllReports, setShowAllReports] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [reportData, setReportData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [recoveredReports, setRecoveredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Publish Adoption Form State
  const [publishForm, setPublishForm] = useState({
    reportId: "",
    name: "",
    species: "Dog",
    breed: "",
    age: "",
    gender: "Male",
    healthNotes: "",
    description: "",
    photoUrl: "",
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes, recoveredRes] = await Promise.all([
        adminService.getStats(),
        reportService.getAll(),
        adminService.getRecoveredReports(),
      ]);

      setStatistics(statsRes.data);
      setRecoveredReports(recoveredRes.data);

      const mapped = reportsRes.data.map((r) => {
        const type = (r.animalType || "Other").toLowerCase();
        const img = r.images && r.images.length > 0 ? r.images[0] : null;
        return {
          id: `AR-${String(r.id).padStart(4, "0")}`,
          databaseId: r.id,
          animal: r.animalName || "Unknown",
          species: r.animalType || "Other",
          location: r.address || `${r.latitude}, ${r.longitude}`,
          imageUrl: img ? (img.startsWith("http") ? img : `${BACKEND_URL}${img}`) : null,
          time: new Date(r.createdAt).toLocaleDateString(),
          status: r.status,
          severity: r.severity,
          background: type === "dog" ? "peach" : type === "cat" ? "lavender" : "mint",
        };
      });

      setReportData(mapped);
    } catch (err) {
      console.warn("Failed loading admin stats:", err);
      setNotice("Could not refresh dashboard statistics from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reportData;

    return reportData.filter((r) =>
      [r.id, r.animal, r.species, r.location, r.status].some((v) =>
        String(v).toLowerCase().includes(query)
      )
    );
  }, [searchTerm, reportData]);

  const visibleReports = showAllReports ? filteredReports : filteredReports.slice(0, 5);

  const totalCount = statistics?.totalReports ?? 0;
  const activeCases = statistics?.activeCases ?? 0;
  const rescuedCount = statistics?.rescuedCount ?? 0;
  const readyForAdoption = statistics?.readyForAdoptionCount ?? 0;
  const adoptedCount = statistics?.adoptedCount ?? 0;
  const volunteersCount = statistics?.volunteersCount ?? 0;

  const typeCounts = statistics?.reportsByType ?? {};
  const dogCount = Number(typeCounts["Dog"] || typeCounts["dog"] || 0);
  const catCount = Number(typeCounts["Cat"] || typeCounts["cat"] || 0);
  const otherCount = Math.max(0, totalCount - dogCount - catCount);

  const dogPercent = totalCount ? Math.round((dogCount / totalCount) * 100) : 0;
  const catPercent = totalCount ? Math.round((catCount / totalCount) * 100) : 0;
  const otherPercent = totalCount ? Math.round((otherCount / totalCount) * 100) : 0;

  const reportsByDay = statistics?.reportsByDay ?? [];
  const maxDailyReports = Math.max(1, ...reportsByDay.map((item) => Number(item.count ?? 0)));

  const donutBackground = totalCount
    ? `conic-gradient(
        #76bb82 0% ${dogPercent}%,
        #e9b46b ${dogPercent}% ${dogPercent + catPercent}%,
        #bca4e5 ${dogPercent + catPercent}% 100%
      )`
    : "#eef2ee";

  const handleSelectRecoveredReport = (reportId) => {
    const report = recoveredReports.find((r) => r.id === Number(reportId));
    if (report) {
      const img = report.images && report.images.length > 0 ? report.images[0] : "";
      setPublishForm({
        reportId: report.id,
        name: report.animalName || `Recovered ${report.animalType}`,
        species: report.animalType || "Dog",
        breed: "Mixed Breed",
        age: "1-2 years",
        gender: "Male",
        healthNotes: "Fully treated and vaccinated. Healthy and active.",
        description: `Rescued from ${report.address || "the field"}. Now healthy, playful, and ready for adoption!`,
        photoUrl: img.startsWith("http") ? img : img ? `${BACKEND_URL}${img}` : "",
      });
    } else {
      setPublishForm((prev) => ({ ...prev, reportId: "" }));
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    try {
      await adoptionService.publish({
        reportId: publishForm.reportId ? Number(publishForm.reportId) : null,
        name: publishForm.name,
        species: publishForm.species,
        breed: publishForm.breed,
        age: publishForm.age,
        gender: publishForm.gender,
        healthNotes: publishForm.healthNotes,
        description: publishForm.description,
        photoUrl: publishForm.photoUrl,
      });

      setNotice(`${publishForm.name} was successfully listed in the Adoption Gallery!`);
      setShowPublishModal(false);
      await loadDashboardData();
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to publish adoption.");
    }
  };

  const navItems = [
    { section: "WORKSPACE", items: [
      { label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { label: "Animal Reports", icon: <FileText size={16} /> },
      { label: "Rescue Cases", icon: <Shield size={16} /> },
      { label: "Volunteers", icon: <UsersIcon size={16} /> },
    ]},
    { section: "MANAGEMENT", items: [
      { label: "Adoptions", icon: <Heart size={16} /> },
      { label: "Users", icon: <HomeIcon size={16} /> },
    ]}
  ];

  return (
    <div className="app-shell">
      {/* Mobile Sidebar Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? "active" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-mark">
              <PawPrint size={20} color="#1b7a43" />
            </div>
            <div>
              <strong>PawRescue</strong>
              <small>ADMIN CENTER</small>
            </div>
          </div>
          {mobileSidebarOpen && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex" }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {navItems.map((group) => (
          <div key={group.section} className="nav-group">
            <div className="nav-section-title">{group.section}</div>
            {group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`nav-link ${activePage === item.label ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.label);
                  setNotice("");
                  setMobileSidebarOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-spacer"></div>

        <Link
          to="/"
          className="nav-link"
          style={{
            border: "1px solid #e5ede5",
            borderRadius: "9px",
            padding: "9px 12px",
            marginTop: "auto",
            textDecoration: "none",
          }}
        >
          <span className="nav-icon"><ExternalLink size={15} /></span>
          <span className="nav-label">Public Website</span>
        </Link>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="sidebar-mobile-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open Navigation Drawer"
            >
              <Menu size={20} />
            </button>

            <div className="search-box">
              <span className="search-icon" style={{ display: "flex", alignItems: "center" }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search reports, volunteers, cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-actions">
            <NotificationBell />
            <div className="topbar-divider"></div>

            <div className="admin-profile">
              <div className="admin-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="admin-details">
                <strong>{user?.name || "System Administrator"}</strong>
                <small>System Admin</small>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              style={{
                background: "transparent",
                border: "1px solid #d4dfd7",
                color: "#61776b",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <LogOut size={13} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice-banner" style={{ margin: "18px 24px 0" }}>
            <CheckCircle2 size={16} flexShrink={0} />
            <span>{notice}</span>
          </div>
        )}

        <div className="page-content" style={{ padding: "24px" }}>
          {activePage === "Animal Reports" && <AnimalReports />}
          {activePage === "Rescue Cases" && <RescueCases />}
          {activePage === "Volunteers" && <Volunteers />}
          {activePage === "Adoptions" && <AdoptionRequests />}
          {activePage === "Users" && <Users />}

          {activePage === "Dashboard" && (
            <>
              {/* Heading */}
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" style={{ background: "#1b7a43", borderRadius: "50%" }}></span>
                    <span>PLATFORM CONTROL CENTER</span>
                  </div>
                  <h1>Platform Dashboard</h1>
                  <p className="welcome-description">
                    Real-time incident response, clinical triage, and adoption operations
                  </p>
                </div>

                <div className="welcome-actions">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(true)}
                    className="primary-button"
                  >
                    <Plus size={15} />
                    <span>Publish Pet for Adoption</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon stat-green">
                      <FileText size={18} />
                    </div>
                    <span className="stat-trend positive">Emergency rescue alerts</span>
                  </div>
                  <div className="stat-label">Total Reports</div>
                  <div className="stat-value-row">
                    <h2>{totalCount}</h2>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon stat-orange">
                      <Clock size={18} />
                    </div>
                    <span className="stat-trend warning">In transit / in clinic</span>
                  </div>
                  <div className="stat-label">Active Field Cases</div>
                  <div className="stat-value-row">
                    <h2>{activeCases}</h2>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon stat-purple">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="stat-trend purple-trend">Safely secured & treated</span>
                  </div>
                  <div className="stat-label">Animals Rescued</div>
                  <div className="stat-value-row">
                    <h2>{rescuedCount}</h2>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon stat-blue">
                      <Heart size={18} />
                    </div>
                    <span className="stat-trend">{adoptedCount} already placed</span>
                  </div>
                  <div className="stat-label">Ready for Adoption</div>
                  <div className="stat-value-row">
                    <h2>{readyForAdoption}</h2>
                  </div>
                </div>
              </div>

              {/* Analytics row: Weekly Chart & Donut */}
              <div className="analytics-grid">
                <div className="panel overview-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Reports Received this Week</h3>
                      <p>Daily intake of emergency alerts</p>
                    </div>
                  </div>

                  <div className="bar-chart">
                    {reportsByDay.map((item) => {
                      const heightPercent = maxDailyReports
                        ? Math.max(12, Math.round((Number(item.count) / maxDailyReports) * 100))
                        : 12;

                      return (
                        <div key={item.date} className="bar-column">
                          <span className="bar-value">{item.count}</span>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${Number(item.count) > 0 ? "bar-highlight" : ""}`}
                              style={{ height: `${heightPercent}%` }}
                            ></div>
                          </div>
                          <span className="bar-label">{item.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="panel distribution-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Reports by Animal Species</h3>
                      <p>Distribution of rescue files</p>
                    </div>
                  </div>

                  <div className="distribution-content">
                    <div className="donut-chart" style={{ background: donutBackground }}>
                      <div className="donut-center">
                        <strong>{totalCount}</strong>
                        <span>Animals</span>
                      </div>
                    </div>

                    <div className="legend">
                      <div className="legend-row">
                        <span className="legend-dot dogs"></span>
                        <span>Dogs</span>
                        <strong>{dogCount} <small>({dogPercent}%)</small></strong>
                      </div>
                      <div className="legend-row">
                        <span className="legend-dot cats"></span>
                        <span>Cats</span>
                        <strong>{catCount} <small>({catPercent}%)</small></strong>
                      </div>
                      <div className="legend-row">
                        <span className="legend-dot other"></span>
                        <span>Other</span>
                        <strong>{otherCount} <small>({otherPercent}%)</small></strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reports Table */}
              <div className="panel reports-panel" style={{ marginTop: "18px" }}>
                <div className="reports-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "800", color: "#314537" }}>Recent Animal Reports</h3>
                    <p style={{ margin: 0, fontSize: "10px", color: "#9aa49d" }}>Latest emergency alerts filed across the coverage area</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setActivePage("Animal Reports")}
                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <span>Manage all reports</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Animal</th>
                        <th>Species</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleReports.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.id}</strong></td>
                          <td>
                            <div style={{ fontWeight: "600" }}>{r.animal}</div>
                          </td>
                          <td>{r.species}</td>
                          <td>{r.location}</td>
                          <td>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "700",
                                background: r.status === "RECOVERED" ? "#ecfdf5" : r.status === "REPORTED" ? "#fef9ee" : "#eff6ff",
                                color: r.status === "RECOVERED" ? "#047857" : r.status === "REPORTED" ? "#b45309" : "#1d4ed8",
                              }}
                            >
                              {r.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td>{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Publish Adoption Modal */}
      {showPublishModal && (
        <div className="modal-backdrop" onClick={() => setShowPublishModal(false)}>
          <div className="modal-card" style={{ maxWidth: "560px", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: 0 }}>
                Publish Pet for Adoption
              </h3>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#61776b", display: "flex", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit}>
              {/* Optional: link recovered report */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#263b31", marginBottom: "4px" }}>
                  Select from Recovered Reports (Optional)
                </label>
                <select
                  value={publishForm.reportId}
                  onChange={(e) => handleSelectRecoveredReport(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                >
                  <option value="">Manual Entry (No linked report)</option>
                  {recoveredReports.map((r) => (
                    <option key={r.id} value={r.id}>
                      #AR-{String(r.id).padStart(4, "0")} &middot; {r.animalName} ({r.animalType}) - Recovered at {r.address || "Field"}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "11px", color: "#61776b", marginTop: "3px" }}>
                  Selecting a recovered report auto-transitions its status to LISTED_FOR_ADOPTION.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={publishForm.name}
                    onChange={(e) => setPublishForm({ ...publishForm, name: e.target.value })}
                    placeholder="e.g. Luna"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Species *
                  </label>
                  <select
                    value={publishForm.species}
                    onChange={(e) => setPublishForm({ ...publishForm, species: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Puppy">Puppy</option>
                    <option value="Kitten">Kitten</option>
                    <option value="Bird">Bird</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Breed
                  </label>
                  <input
                    type="text"
                    value={publishForm.breed}
                    onChange={(e) => setPublishForm({ ...publishForm, breed: e.target.value })}
                    placeholder="e.g. Indie / Mix"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Age
                  </label>
                  <input
                    type="text"
                    value={publishForm.age}
                    onChange={(e) => setPublishForm({ ...publishForm, age: e.target.value })}
                    placeholder="e.g. 1 year"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Gender
                  </label>
                  <select
                    value={publishForm.gender}
                    onChange={(e) => setPublishForm({ ...publishForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Photo URL
                </label>
                <input
                  type="url"
                  value={publishForm.photoUrl}
                  onChange={(e) => setPublishForm({ ...publishForm, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Health & Medical Notes
                </label>
                <input
                  type="text"
                  value={publishForm.healthNotes}
                  onChange={(e) => setPublishForm({ ...publishForm, healthNotes: e.target.value })}
                  placeholder="e.g. Neutered, fully vaccinated, dewormed"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Bio & Personality Description
                </label>
                <textarea
                  rows={3}
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                  placeholder="Describe temperament, behavior, ideal home setting..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4dfd7", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #d4dfd7", background: "#fff", cursor: "pointer", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", borderRadius: "8px", background: "#1b7a43", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                >
                  Publish to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
