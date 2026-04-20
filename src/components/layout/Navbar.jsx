import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <Link to="/dashboard" className="text-lg font-semibold text-indigo-600">
        ✈ TravelPlanner
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
