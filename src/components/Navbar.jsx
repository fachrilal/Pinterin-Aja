import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { HomeIcon, UserGroupIcon, BookOpenIcon, ArrowPathIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    navigate('/login')
  }

  return (
    <div className="pt-20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100 px-6 py-4 w-full flex items-center justify-between shadow">
        {/* Kiri: Status */}
        <div className="text-sm text-gray-700 font-medium flex items-center">
          <BookOpenIcon className="w-6 h-6 mr-2 text-blue-700" />
          <span className="inline-block w-2 h-2 bg-grey-500 rounded-full mr-2"></span>
          Pinterin Aja
        </div>

        {/* Tengah: Logo + menu */}
        <div className="bg-white rounded-full px-4 py-2 flex items-center space-x-6 border border-gray-300 shadow-sm">
          <div className="bg-black rounded-full w-7 h-7 flex items-center justify-center text-white font-bold text-xs">
            📚
          </div>
          <ul className="flex space-x-6 text-gray-700 text-sm font-medium">
            {isLoggedIn && (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 hover:text-gray-900 transition"
                    title="Dashboard"
                  >
                    <HomeIcon className="w-5 h-5" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/buku"
                    className="flex items-center space-x-1 hover:text-gray-900 transition"
                    title="Books"
                  >
                    <BookOpenIcon className="w-5 h-5" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/member"
                    className="flex items-center space-x-1 hover:text-gray-900 transition"
                    title="Member"
                  >
                    <UserGroupIcon className="w-5 h-5" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/lending"
                    className="flex items-center space-x-1 hover:text-gray-900 transition"
                    title="Peminjaman"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fine"
                    className="flex items-center space-x-1 hover:text-gray-900 transition"
                    title="Denda"
                  >
                    <CurrencyDollarIcon className="w-5 h-5" />
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Kanan: Login / Logout */}
        <div>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-1 rounded-full border border-gray-700 text-sm text-gray-800 font-medium hover:bg-gray-200 transition"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1 rounded-full border border-gray-700 text-sm text-gray-800 font-medium hover:bg-gray-200 transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
      {/* ...konten halaman... */}
    </div>
  )
}
