import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/Dashboard";
import AppShell from "./components/AppShell";
import Fields from "./components/Fields";
import FieldCrops from "./components/FieldCrops";
import GlobalTasks from "./components/GlobalTasks";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/auth-context";
import { AppPreferencesProvider } from "./i18n";

// Προστατευμένη διαδρομή με ενσωματωμένο Layout (Navbar)
function ProtectedRoute() {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-lg font-black text-emerald-700">
        Φόρτωση προφίλ...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ΔΗΜΟΣΙΕΣ ΔΙΑΔΡΟΜΕΣ */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ΠΡΟΣΤΑΤΕΥΜΕΝΕΣ ΔΙΑΔΡΟΜΕΣ (Εδώ μέσα μπαίνουν όλα όσα θέλουν Navbar) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fields" element={<Fields />} />
              <Route path="/fields/:fieldId" element={<FieldCrops />} />
              <Route path="/fields/:fieldId/crops" element={<FieldCrops />} />
              <Route path="/tasks" element={<GlobalTasks />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Redirects */}
            <Route path="*" element={<AuthRedirect />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AppPreferencesProvider>
  );
}

function AuthRedirect() {
  const { authLoading, isAuthenticated } = useAuth();
  if (authLoading) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
