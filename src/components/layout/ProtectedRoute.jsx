import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (user === undefined) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
