import { useEffect, useRef, useState } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardPage from "./pages/DashboardPage";
import SubmitPage from "./pages/SubmitPage";
import WallPage from "./pages/WallPage";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const linkClassName = ({ isActive }) =>
    [
      "rounded-md px-2 py-1 text-sm transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      isActive ? "text-gray-900 underline underline-offset-4" : "text-gray-600 hover:text-gray-900"
    ].join(" ");

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
      <div ref={menuRef} className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <NavLink
          to="/"
          className="rounded-md text-lg font-bold text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          TestimonialHub
        </NavLink>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/wall" className={linkClassName}>
            Wall
          </NavLink>
          <NavLink to="/dashboard" className={linkClassName}>
            Dashboard
          </NavLink>
        </nav>

        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-xl text-gray-700 transition-colors duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            ☰
          </button>

          {mobileMenuOpen ? (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <div className="flex flex-col gap-1">
                <NavLink to="/wall" className={linkClassName}>
                  Wall
                </NavLink>
                <NavLink to="/dashboard" className={linkClassName}>
                  Dashboard
                </NavLink>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="min-h-screen pt-16">
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">
            <Routes>
              <Route path="/" element={<SubmitPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/wall" element={<WallPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
