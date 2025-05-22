import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import Login from "../pages/Login";
import Template from "../layout/Template";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../middleware/ProtectedRoute";
import MemberList from "../pages/Member/MemberList.jsx";
import MemberIndex from "../pages/Member/MemberList.jsx";
import BooksIndex from "../pages/Books/Books.jsx";
import Lending from "../pages/Lendings/Lending.jsx";
import Fine from "../pages/fine/Fine.jsx";
import MemberHistory from "../pages/fine/Fine.jsx";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Template />,  // Template tanpa proteksi agar login bisa diakses
    children: [
      { path: 'login', element: <Login /> }, // halaman login terbuka

      // Kalau akses root '/', langsung redirect ke login (atau dashboard jika login)
      { path: '', element: <Navigate to="/login" replace /> }
    ]
  },
  {
    path: '/',
    element: <ProtectedRoute><Template /></ProtectedRoute>, // proteksi untuk halaman dalam
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'member', element: <MemberIndex />},
      { path: 'buku', element: <BooksIndex />},
      { path: 'lending', element: <Lending />},
      { path: 'fine', element: <MemberHistory />}, // contoh route lain yang butuh proteksi
      // tambah route lain yang butuh proteksi di sini
    ]
  }
]);
