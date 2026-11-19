import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../NotificationBell";
import {
  PawPrint,
  AlertTriangle,
  Heart,
  Home,
  ClipboardList,
  FileText,
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isVolunteer, isUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className="topbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#ffffff",
        borderBottom: "1px solid #e5ebe5",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          to="/"
          onClick={closeMenu}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#1b7a43",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PawPrint size={20} />
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "18px", color: "#263b31", lineHeight: 1.1 }}>
              PawRescue
            </div>
            <div style={{ fontSize: "11px", color: "#5d7367", letterSpacing: "0.5px", fontWeight: "600" }}>
              COMMUNITY RESCUE & ADOPTION
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-links" style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "14px" }}>
          <Link
            to="/"
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive("/") ? "700" : "500",
              color: isActive("/") ? "#1b7a43" : "#44594e",
              background: isActive("/") ? "#e8f5ec" : "transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Home size={15} />
            <span>Home</span>
          </Link>
          <Link
            to="/adoptions"
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive("/adoptions") ? "700" : "500",
              color: isActive("/adoptions") ? "#1b7a43" : "#44594e",
              background: isActive("/adoptions") ? "#e8f5ec" : "transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Heart size={15} />
            <span>Adopt a Pet</span>
          </Link>
          <Link
            to="/report"
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive("/report") ? "700" : "600",
              color: isActive("/report") ? "#b91c1c" : "#c2410c",
              background: isActive("/report") ? "#fee2e2" : "#fff7ed",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #fed7aa",
            }}
          >
            <AlertTriangle size={15} />
            <span>Report Animal</span>
          </Link>

          {/* Citizen User links */}
          {isAuthenticated && isUser && (
            <>
              <Link
                to="/my-reports"
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: isActive("/my-reports") ? "700" : "500",
                  color: isActive("/my-reports") ? "#1b7a43" : "#44594e",
                  background: isActive("/my-reports") ? "#e8f5ec" : "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ClipboardList size={15} />
                <span>My Reports</span>
              </Link>
              <Link
                to="/my-requests"
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: isActive("/my-requests") ? "700" : "500",
                  color: isActive("/my-requests") ? "#1b7a43" : "#44594e",
                  background: isActive("/my-requests") ? "#e8f5ec" : "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FileText size={15} />
                <span>My Applications</span>
              </Link>
            </>
          )}

          {/* Volunteer links */}
          {isAuthenticated && isVolunteer && (
            <Link
              to="/volunteer"
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: isActive("/volunteer") ? "700" : "500",
                color: isActive("/volunteer") ? "#1b7a43" : "#44594e",
                background: isActive("/volunteer") ? "#e8f5ec" : "transparent",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={15} />
              <span>Assigned Cases</span>
            </Link>
          )}

          {/* Admin link */}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin"
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: location.pathname.startsWith("/admin") ? "700" : "500",
                color: location.pathname.startsWith("/admin") ? "#1b7a43" : "#44594e",
                background: location.pathname.startsWith("/admin") ? "#e8f5ec" : "transparent",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <LayoutDashboard size={15} />
              <span>Admin Center</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <NotificationBell />
        <div className="topbar-divider"></div>

        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="profile-pill" style={{ cursor: "default" }}>
              <div
                className="avatar"
                style={{
                  background: isAdmin ? "#1b7a43" : isVolunteer ? "#e9b46b" : "#76bb82",
                  color: "#ffffff",
                  fontWeight: "bold",
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="admin-details">
                <div className="admin-name">{user?.name}</div>
                <div className="admin-role">
                  {isAdmin ? "Administrator" : isVolunteer ? "Rescue Volunteer" : "Citizen"}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid #dce5df",
                color: "#6c8376",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Logout from platform"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1px solid #d4dfd7",
                color: "#263b31",
                fontSize: "14px",
                fontWeight: "600",
                background: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <User size={14} />
              <span>Log in</span>
            </Link>
            <Link
              to="/signup"
              style={{
                textDecoration: "none",
                padding: "7px 14px",
                borderRadius: "8px",
                background: "#1b7a43",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                border: "1px solid #1b7a43",
              }}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <Link to="/" onClick={closeMenu} className={isActive("/") ? "active" : ""}>
            <Home size={16} /> Home
          </Link>
          <Link to="/adoptions" onClick={closeMenu} className={isActive("/adoptions") ? "active" : ""}>
            <Heart size={16} /> Adopt a Pet
          </Link>
          <Link to="/report" onClick={closeMenu} className={isActive("/report") ? "active" : ""}>
            <AlertTriangle size={16} color="#c2410c" /> Report Animal
          </Link>

          {isAuthenticated && isUser && (
            <>
              <Link to="/my-reports" onClick={closeMenu} className={isActive("/my-reports") ? "active" : ""}>
                <ClipboardList size={16} /> My Reports
              </Link>
              <Link to="/my-requests" onClick={closeMenu} className={isActive("/my-requests") ? "active" : ""}>
                <FileText size={16} /> My Applications
              </Link>
            </>
          )}

          {isAuthenticated && isVolunteer && (
            <Link to="/volunteer" onClick={closeMenu} className={isActive("/volunteer") ? "active" : ""}>
              <Shield size={16} /> Assigned Cases
            </Link>
          )}

          {isAuthenticated && isAdmin && (
            <Link to="/admin" onClick={closeMenu} className={location.pathname.startsWith("/admin") ? "active" : ""}>
              <LayoutDashboard size={16} /> Admin Center
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
