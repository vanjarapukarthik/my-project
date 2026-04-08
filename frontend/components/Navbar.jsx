import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  FiMenu,
  FiMail,
  FiBell,
  FiSettings,
  FiHelpCircle,
  FiVideo,
  FiFilm,
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiChevronDown,
  FiLogOut,
} from "react-icons/fi";

const navItems = [
  { to: "/", label: "Home", icon: FiGrid },
  { to: "/appointments", label: "Appointments", icon: FiCalendar },
  { to: "/video-consultation", label: "Video Consultation", icon: FiVideo },
  { to: "/recordings", label: "Recordings", icon: FiFilm },
  { to: "/dashboard", label: "Doctor Dashboard", icon: FiGrid, roles: ["doctor", "admin"] },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2, roles: ["doctor", "admin"] },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <header className="header-gradient border-b border-white/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <div className="flex items-center gap-6">
            <button
              className="p-2 rounded-lg text-white/90 hover:bg-white/15 lg:hidden transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shadow-sm backdrop-blur-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-white text-sm">Telehealth</span>
                <span className="text-white/80 text-xs block -mt-0.5">Platform</span>
              </div>
            </Link>
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1">
                {visibleNavItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      location.pathname === to
                        ? "bg-white/25 text-white"
                        : "text-white/90 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <button
                  className="relative p-2 rounded-lg text-white/90 hover:bg-white/15 transition"
                  aria-label="Messages"
                >
                  <FiMail className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    3
                  </span>
                </button>
                <button
                  className="p-2 rounded-lg text-white/90 hover:bg-white/15 transition"
                  aria-label="Notifications"
                >
                  <FiBell className="w-5 h-5" />
                </button>
                <button
                  className="p-2 rounded-lg text-white/90 hover:bg-white/15 transition"
                  aria-label="Settings"
                >
                  <FiSettings className="w-5 h-5" />
                </button>
                <button
                  className="p-2 rounded-lg text-white/90 hover:bg-white/15 transition"
                  aria-label="Help"
                >
                  <FiHelpCircle className="w-5 h-5" />
                </button>
                <div className="relative ml-2">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-lg hover:bg-white/15 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2) || "?"}
                      </span>
                    </div>
                    <FiChevronDown
                      className={`w-4 h-4 text-white/90 transition ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <div className="absolute right-0 top-full mt-1 w-52 py-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                          <p className="text-xs text-slate-500">{user?.email}</p>
                          <p className="text-xs text-blue-600 font-medium mt-0.5 capitalize">
                            {user?.role}
                          </p>
                        </div>
                        <Link
                          to="/"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiGrid className="w-4 h-4" /> Home
                        </Link>
                        {(user?.role === "doctor" || user?.role === "admin") && (
                          <>
                            <Link
                              to="/dashboard"
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <FiGrid className="w-4 h-4" /> Dashboard
                            </Link>
                            <Link
                              to="/analytics"
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <FiBarChart2 className="w-4 h-4" /> Analytics
                            </Link>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                        >
                          <FiLogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/95 hover:bg-white/15 transition border border-white/30"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#1E5AA8] bg-white hover:bg-white/95 transition font-semibold"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
        {menuOpen && isAuthenticated && (
          <nav className="lg:hidden py-3 border-t border-white/20 space-y-0.5">
            {visibleNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === to ? "bg-white/25 text-white" : "text-white/90 hover:bg-white/15"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
