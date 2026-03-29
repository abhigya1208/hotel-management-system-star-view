import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Logs from './pages/Logs';
import PublicBooking from './pages/PublicBooking';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/book" element={<PublicBooking />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['admin', 'leaser']}><Reports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute roles={['admin']}><Logs /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
