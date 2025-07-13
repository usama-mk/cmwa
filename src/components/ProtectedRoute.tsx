import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "client" | "admin";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  console.log("ProtectedRoute check:", {
    user: !!user,
    profile: !!profile,
    loading,
    requiredRole,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If we have a user but no profile, we're still loading the profile
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log("Redirecting to login - no user or profile");
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    console.log(
      `Redirecting - user has role ${profile.role}, required ${requiredRole}`
    );
    return (
      <Navigate
        to={profile.role === "admin" ? "/admin" : "/dashboard"}
        replace
      />
    );
  }

  console.log("Access granted to protected route");
  return <>{children}</>;
}
