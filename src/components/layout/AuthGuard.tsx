import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated, refreshSession } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      await refreshSession();
      setIsLoading(false);
    };

    // Set up auth state listener
    try {
      // Skip auth listener and just check session directly
      console.log("Checking auth session directly");
      checkSession();
      return () => {};
    } catch (error) {
      console.error("Error checking auth session:", error);
      setIsLoading(false);
      return () => {};
    }
  }, [refreshSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0089AD]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== "admin") {
    // Redirect to dashboard if not an admin but admin access is required
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
