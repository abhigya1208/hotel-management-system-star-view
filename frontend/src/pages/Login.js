import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-peach-light relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-peach rounded-full translate-y-1/2 -translate-x-1/2 opacity-40" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg mb-4 text-4xl">⭐</div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Hotel Star View</h1>
          <p className="text-gray-500 text-sm mt-1">Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-orange-50 p-8">
          <h2 className="font-display font-semibold text-xl text-gray-700 mb-6">Sign In</h2>
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Username / ID</label>
              <input
                className="input-field"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200 mt-2 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <a href="/book" className="text-sm text-blue-500 hover:text-blue-600 font-medium">🌐 Public Booking Page</a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This site is created and maintained by <span className="text-orange-400 font-medium">Abhigya</span>
        </p>
      </div>
    </div>
  );
}