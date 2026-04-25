import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar"; 
import Fields from "./components/Fields";
import FieldCrops from "./components/FieldCrops";
import GlobalTasks from "./components/GlobalTasks";
import Analytics from "./components/Analytics";

// Helper συνάρτηση για το Auth
const isLoggedIn = () => !!localStorage.getItem("jwt");

// Προστατευμένη διαδρομή με ενσωματωμένο Layout (Navbar)
function PrivateRoute() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Το Navbar θα εμφανίζεται σε ΟΛΕΣ τις προστατευμένες σελίδες */}
      <Navbar /> 
      
      {/* Εδώ μέσα θα "κουμπώνουν" οι σελίδες Dashboard, Fields, κλπ. */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet /> 
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
     
      <Routes>
        {/* ΔΗΜΟΣΙΕΣ ΔΙΑΔΡΟΜΕΣ */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ΠΡΟΣΤΑΤΕΥΜΕΝΕΣ ΔΙΑΔΡΟΜΕΣ (Εδώ μέσα μπαίνουν όλα όσα θέλουν Navbar) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fields" element={<Fields />} /> 
          <Route path="/fields/:fieldId" element={<FieldCrops />} />
          <Route path="/fields/:fieldId/crops" element={<FieldCrops />} />
          <Route path="/tasks" element={<GlobalTasks />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        {/* Redirects */}
        <Route path="*" element={<Navigate to={isLoggedIn() ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}