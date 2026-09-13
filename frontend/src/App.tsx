import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Home, Bookmark, Building, BarChart2, Key } from 'lucide-react';
import Login from './pages/Login';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Saved from './pages/Saved';
import Rentals from './pages/Rentals';
import Projects from './pages/Projects';
import Insights from './pages/Insights';

const ProtectedRoute = ({ children }: { children: any }) => {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const Layout = ({ children }: { children: any }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">Ivy Homes</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                  <Home className="w-4 h-4 mr-1" /> Listings
                </Link>
                <Link to="/rentals" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  <Key className="w-4 h-4 mr-1" /> Rentals
                </Link>
                <Link to="/projects" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  <Building className="w-4 h-4 mr-1" /> Projects
                </Link>
                <Link to="/saved" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  <Bookmark className="w-4 h-4 mr-1" /> Saved
                </Link>
                <Link to="/insights" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  <BarChart2 className="w-4 h-4 mr-1" /> Insights
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  window.location.href = '/login';
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
        <Route path="/saved" element={<ProtectedRoute><Layout><Saved /></Layout></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
