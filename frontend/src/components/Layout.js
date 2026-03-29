import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager', 'leaser'] },
  { path: '/rooms', label: 'Room Status', icon: '🏨', roles: ['admin', 'manager', 'leaser'] },
  { path: '/bookings', label: 'Bookings', icon: '📋', roles: ['admin', 'manager', 'leaser'] },
  { path: '/expenses', label: 'Expenses', icon: '💰', roles: ['admin', 'manager', 'leaser'] },
  { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'leaser'] },
  { path: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
  { path: '/logs', label: 'Activity Logs', icon: '🔍', roles: ['admin'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const allowed = navItems.filter(n => n.roles.includes(user?.role));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-orange-50 md:hidden">
              <span className="text-xl">☰</span>
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-display font-bold text-orange-500 text-base leading-tight">Hotel Star View</div>
                <div className="text-xs text-gray-400 leading-tight">Management System</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
              <span className="text-orange-400 text-sm">👤</span>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
            </div>
            <a href="/book" target="_blank" className="hidden md:block text-sm text-blue-500 hover:text-blue-600 font-medium px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all">
              🌐 Public Site
            </a>
            <button onClick={handleLogout} className="btn-secondary text-sm px-3 py-1.5">Logout</button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 top-16 z-30 w-56 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-200 md:relative md:top-0 md:translate-x-0 md:block md:w-52 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-3 space-y-1 mt-2">
            {allowed.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${location.pathname === item.path ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          {/* Role badge at bottom */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-gradient-to-r from-orange-50 to-peach-light rounded-xl p-3 border border-orange-100">
              <div className="text-xs text-gray-500">Logged in as</div>
              <div className="font-semibold text-gray-700 text-sm truncate">{user?.name}</div>
              <div className="text-xs text-orange-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-h-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-3 text-center text-xs text-gray-400">
        Hotel Star View Management System &mdash; <span className="text-orange-400 font-medium">This site is created and maintained by Abhigya</span>
      </footer>
    </div>
  );
}
