import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ReportAnimal from "./pages/ReportAnimal";
import MyReports from "./pages/MyReports";
import AdoptionList from "./pages/AdoptionList";
import AdoptionDetail from "./pages/AdoptionDetail";
import MyAdoptionRequests from "./pages/MyAdoptionRequests";
import VolunteerCases from "./pages/VolunteerCases";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/adoptions" element={<AdoptionList />} />
          <Route path="/adoptions/:id" element={<AdoptionDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Citizen / User Routes */}
          <Route path="/report" element={<ReportAnimal />} />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute allowedRoles={["ROLE_USER", "ROLE_ADMIN", "ROLE_VOLUNTEER"]}>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute allowedRoles={["ROLE_USER", "ROLE_ADMIN", "ROLE_VOLUNTEER"]}>
                <MyAdoptionRequests />
              </ProtectedRoute>
            }
          />

          {/* Volunteer Routes */}
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={["ROLE_VOLUNTEER", "ROLE_ADMIN"]}>
                <VolunteerCases />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
