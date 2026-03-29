import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await API.get('/reports/dashboard');
        setData(res.data);
      } catch { }
      setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAlertRead = async (id) => {
    await API.put(`/bookings/${id}/alert-read`);
    setData(d => ({ ...d, webAlerts: d.webAlerts - 1, webAlertBookings: d.webAlertBookings.filter(b => b._id !== id) }));
  };

  if (loading) return <Spinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name}</p>
        </div>
        <div className="text-sm text-gray-400 hidden md:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      {/* Web Booking Alerts */}
      {data?.webAlertBookings?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600 font-semibold">🔔 New Web Bookings ({data.webAlertBookings.length})</span>
          </div>
          <div className="space-y-2">
            {data.webAlertBookings.map(b => (
              <div key={b._id} className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold">{b.guests?.[0]?.name}</span>
                  <span className="text-gray-500"> · {b.roomNumber} · {b.guests?.[0]?.phone}</span>
                  <span className="text-xs text-gray-400 ml-2">{formatDateTime(b.createdAt)}</span>
                </div>
                <div className="flex gap-2">
                  <Link to="/bookings" className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600">View</Link>
                  <button onClick={() => markAlertRead(b._id)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today Stats */}
      <div>
        <h2 className="font-display font-semibold text-gray-700 mb-3 text-lg">Today</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Bookings" value={data?.today?.bookings || 0} icon="📋" color="orange" />
          <StatCard title="Revenue" value={formatCurrency(data?.today?.revenue)} icon="💵" color="green" />
          <StatCard title="Expenses" value={formatCurrency(data?.today?.expenses)} icon="💸" color="red" />
          <StatCard title="Sir Payments" value={formatCurrency(data?.today?.sirPayments)} icon="🤝" color="purple" />
        </div>
      </div>

      {/* Room Occupancy */}
      <div>
        <h2 className="font-display font-semibold text-gray-700 mb-3 text-lg">Rooms</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total Rooms" value={data?.rooms?.total || 0} icon="🏨" color="blue" />
          <StatCard title="Occupied" value={data?.rooms?.occupied || 0} icon="🔴" color="red" />
          <StatCard title="Vacant" value={data?.rooms?.vacant || 0} icon="🟢" color="green" />
          <StatCard title="Ready" value={data?.rooms?.ready || 0} icon="🟡" color="amber" />
          <StatCard title="Occupancy %" value={`${data?.rooms?.occupancyRate || 0}%`} icon="📊" color="purple" />
        </div>
      </div>

      {/* Occupancy Bar */}
      {data?.rooms?.total > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Room Occupancy Overview</h3>
          <div className="flex rounded-xl overflow-hidden h-8 mb-3">
            {data.rooms.occupied > 0 && (
              <div className="bg-red-400 flex items-center justify-center text-white text-xs font-bold transition-all" style={{ width: `${(data.rooms.occupied / data.rooms.total) * 100}%` }}>
                {data.rooms.occupied}
              </div>
            )}
            {data.rooms.ready > 0 && (
              <div className="bg-yellow-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(data.rooms.ready / data.rooms.total) * 100}%` }}>
                {data.rooms.ready}
              </div>
            )}
            {data.rooms.maintenance > 0 && (
              <div className="bg-gray-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(data.rooms.maintenance / data.rooms.total) * 100}%` }}>
                {data.rooms.maintenance}
              </div>
            )}
            {data.rooms.vacant > 0 && (
              <div className="bg-green-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(data.rooms.vacant / data.rooms.total) * 100}%` }}>
                {data.rooms.vacant}
              </div>
            )}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Occupied</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Ready</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Maintenance</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Vacant</span>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      {(user?.role === 'admin' || user?.role === 'leaser') && (
        <div>
          <h2 className="font-display font-semibold text-gray-700 mb-3 text-lg">This Month</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Bookings" value={data?.month?.bookings || 0} icon="📅" color="blue" />
            <StatCard title="Total Revenue" value={formatCurrency(data?.month?.revenue)} icon="💰" color="green" />
            <StatCard title="Total Expenses" value={formatCurrency(data?.month?.expenses)} icon="🧾" color="red" />
            <StatCard title="Net Revenue" value={formatCurrency((data?.month?.revenue || 0) - (data?.month?.expenses || 0) - (data?.month?.sirPayments || 0))} icon="📈" color="purple" sub="After expenses & sir" />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/bookings?new=1" className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-all">
            <span className="text-2xl">➕</span>
            <div><div className="font-semibold text-sm">New Booking</div><div className="text-xs opacity-70">Add reservation</div></div>
          </Link>
          <Link to="/rooms" className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all">
            <span className="text-2xl">🏨</span>
            <div><div className="font-semibold text-sm">Room Status</div><div className="text-xs opacity-70">View all rooms</div></div>
          </Link>
          <Link to="/expenses?new=1" className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 transition-all">
            <span className="text-2xl">💸</span>
            <div><div className="font-semibold text-sm">Add Expense</div><div className="text-xs opacity-70">Record payment</div></div>
          </Link>
          {(user?.role === 'admin' || user?.role === 'leaser') && (
            <Link to="/reports" className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all">
              <span className="text-2xl">📊</span>
              <div><div className="font-semibold text-sm">Reports</div><div className="text-xs opacity-70">Analytics & export</div></div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
