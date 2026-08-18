import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Wait until userData is loaded
  if (currentUser && !userData) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    if (userData?.role === "admin") return <Navigate to="/admin" replace />;
    if (userData?.role === "driver") return <Navigate to="/driver" replace />;
    if (userData?.role === "student") return <Navigate to="/student" replace />;
    
    // Fallback
    return <Navigate to="/login" replace />;
  }

  return children;
};
