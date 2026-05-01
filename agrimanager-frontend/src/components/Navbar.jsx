import { Link } from "react-router-dom";
import { Button } from "./ui";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-6">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-black text-green-600">AgriManager 🚜</h1>
        <div className="hidden md:flex gap-6 font-semibold text-gray-600">
          <Link to="/dashboard" className="hover:text-green-600 transition">Αρχική</Link>
          <Link to="/fields" className="hover:text-green-600 transition">Χωράφια</Link>
          <Link to="/tasks" className="hover:text-green-600 transition">Εργασίες</Link>
          <Link to="/analytics" className="hover:text-green-600 transition">Στατιστικά</Link>
          <Link to="/profile" className="hover:text-green-600 transition">Προφίλ</Link>
        </div>
      </div>
      <Button
        onClick={handleLogout}
        variant="danger"
      >
        Αποσύνδεση
      </Button>
    </nav>
  );
}
