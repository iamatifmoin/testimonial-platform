import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";

function SubmitPage() {
  return <div>SubmitPage</div>;
}

function DashboardPage() {
  return <div>DashboardPage</div>;
}

function WallPage() {
  return <div>WallPage</div>;
}

function Navbar() {
  const linkClassName = ({ isActive }) =>
    [
      "text-sm transition-colors duration-150 ease-in-out",
      isActive ? "text-gray-900 underline underline-offset-4" : "text-gray-600 hover:text-gray-900"
    ].join(" ");

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <NavLink to="/" className="text-lg font-bold text-primary-600">
          TestimonialHub
        </NavLink>
        <nav className="flex items-center gap-6">
          <NavLink to="/wall" className={linkClassName}>
            Wall
          </NavLink>
          <NavLink to="/dashboard" className={linkClassName}>
            Dashboard
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
