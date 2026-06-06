import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-ink">
    <div className="h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

export const StaffRoute = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "sub_admin") return <Navigate to="/" replace />;
  return children;
};
