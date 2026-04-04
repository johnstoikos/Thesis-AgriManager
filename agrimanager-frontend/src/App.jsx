import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Navbar from "./components/Navbar"; 
import Fields from "./Fields";

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
        {/* ΔΗΜΟΣΙΕΣ ΔΙΑΔΡΟΜΕΣ (Χωρίς Navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ΠΡΟΣΤΑΤΕΥΜΕΝΕΣ ΔΙΑΔΡΟΜΕΣ (Με Navbar) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Εδώ θα προσθέσουμε αργότερα: 
              <Route path="/fields" element={<Fields />} /> 
          */}
        </Route>

        {/* Redirects */}
        <Route path="*" element={<Navigate to={isLoggedIn() ? "/dashboard" : "/login"} replace />} />
        <Route path="/fields" element={<Fields />} />
      </Routes>
    </Router>
  );
}