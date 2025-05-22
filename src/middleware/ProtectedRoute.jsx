import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    // Kalau tidak ada token, redirect ke login
    return <Navigate to="/login" replace />;
  }

  // Kalau ada token, render komponen anak
  return children;
}
