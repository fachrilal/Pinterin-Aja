import { useState, useEffect } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Cek token dan redirect jika sudah login (hook di level atas komponen)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Proses login saat form submit
  const loginProcess = (e) => {
    e.preventDefault();
    setError(null);

    axios
      .post("http://45.64.100.26:88/perpus-api/public/api/login", login, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(res => {
        if (res.data && res.data.token) {
          localStorage.setItem("token", res.data.token);
          navigate("/dashboard");
        }
      })
      .catch((err) => {
        let msg = "Login gagal. Silakan coba lagi.";
        if (err.response && err.response.data) {
          if (typeof err.response.data === "string") {
            msg = err.response.data;
          } else if (err.response.data.message) {
            msg = err.response.data.message;
          } else if (err.response.data.error) {
            msg = err.response.data.error;
          }
        }
        setError({ message: msg });
      });
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden flex flex-col bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200">
      <div className="flex-grow flex items-center justify-center px-6 sm:px-12 py-12">
        <div className="bg-white shadow-lg rounded-xl w-full max-w-full lg:max-w-4xl flex flex-col lg:flex-row overflow-hidden">
          <div className="hidden lg:flex flex-col justify-center flex-1 bg-gray-50 px-12 py-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Selamat Datang di Perpustakaan
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Silakan masuk dengan email dan password Anda untuk mengakses sistem.
            </p>
          </div>

          <div className="flex-1 px-8 py-12 w-full">
            <h3 className="text-2xl font-semibold text-gray-800 mb-10 text-center">
              Login Petugas
            </h3>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error.message}</p>
              </div>
            )}

            <form onSubmit={loginProcess} className="space-y-8">
              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="text"
                    placeholder="Masukkan email"
                    className="w-full border border-gray-300 rounded-md py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                    value={login.email}
                    onChange={(e) =>
                      setLogin({ ...login, email: e.target.value })
                    }
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaUser />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    className="w-full border border-gray-300 rounded-md py-3 pl-4 pr-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                    value={login.password}
                    onChange={(e) =>
                      setLogin({ ...login, password: e.target.value })
                    }
                    required
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaLock />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-md hover:bg-gray-800 transition"
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
