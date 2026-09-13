import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { api } from './api';
import Login from './pages/Login';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Saved from './pages/Saved';
import Rentals from './pages/Rentals';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Insights from './pages/Insights';

const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`inline-flex items-center px-1 pt-1 text-sm font-semibold transition-colors border-b-2 ${isActive ? 'text-indigo-600 border-indigo-600' : 'text-slate-600 border-transparent hover:text-indigo-600 hover:border-indigo-300'}`}>
      {children}
    </Link>
  );
};

const ProtectedRoute = ({ children }: { children: any }) => {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const Layout = ({ children }: { children: any }) => {
  const handleLogout = async () => {
    try {
      // Tell server to invalidate the token — fire-and-forget (never block logout on failure)
      await api.post('/auth/logout');
    } catch {
      // Ignore — always clear local session regardless
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-2 shadow-lg shadow-indigo-200">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">Ivy Homes</span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <NavLink to="/">Listings</NavLink>
                <NavLink to="/rentals">Rentals</NavLink>
                <NavLink to="/projects">Projects</NavLink>
                <NavLink to="/saved">Saved</NavLink>
                <NavLink to="/insights">Insights</NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout><Browse /></Layout></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ProtectedRoute><Layout><ListingDetail /></Layout></ProtectedRoute>} />
        <Route path="/rentals" element={<ProtectedRoute><Layout><Rentals /></Layout></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><Layout><Saved /></Layout></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
