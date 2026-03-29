import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { formatCurrency, formatDate } from '../utils/helpers';
import { exportBookingsPDF, exportBookingsExcel, exportExpensesPDF, exportExpensesExcel, exportToPDF } from '../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#FF6B2B', '#2E7D32', '#1976D2', '#9C27B0', '#F44336', '#FF9800'];

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [rangeReport, setRangeReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anaLoading, setAnaLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const load = async () => {
      setAnaLoading(true);
      try {
        const { data } = await API.get('/reports/analytics', { params: { days } });
        setAnalytics(data.data);
      } catch { }
      setAnaLoading(false);
    };
    load();
  }, [days]);

  const loadRange = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/reports/range', { params: { startDate, endDate } });
      setRangeReport(data.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load report' });
    }
    setLoading(false);
  };

  const sourceData = rangeReport ? Object.entries(rangeReport.bySource).map(([k, v]) => ({ name: k, bookings: v.count, revenue: v.revenue })) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-800">Reports & Analytics</h1>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Trend Analytics */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display font-semibold text-gray-700">Booking Trends</h2>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Show last:</span>
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${days === d ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {anaLoading ? <Spinner /> : analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Max Booking Day</div>
                <div className="font-bold text-gray-800 mt-1">{analytics.maxBookingDay ? formatDate(analytics.maxBookingDay.date) : '—'}</div>
                <div className="text-2xl font-display font-bold text-orange-500 mt-0.5">{analytics.maxBookingDay?.bookings || 0} bookings</div>
                <div className="text-xs text-green-600">{formatCurrency(analytics.maxBookingDay?.revenue)} revenue</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Min Booking Day</div>
                <div className="font-bold text-gray-800 mt-1">{analytics.minBookingDay ? formatDate(analytics.minBookingDay.date) : '—'}</div>
                <div className="text-2xl font-display font-bold text-blue-500 mt-0.5">{analytics.minBookingDay?.bookings || 0} bookings</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Period Total</div>
                <div className="text-2xl font-display font-bold text-green-600 mt-2">
                  {formatCurrency(analytics.trend.reduce((s, d) => s + d.revenue, 0))}
                </div>
                <div className="text-xs text-gray-500">{analytics.trend.reduce((s, d) => s + d.bookings, 0)} total bookings</div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend.slice(-30)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val, name) => [name === 'revenue' ? formatCurrency(val) : val, name]} labelFormatter={d => formatDate(d)} />
                  <Bar dataKey="bookings" fill="#FF6B2B" radius={[4,4,0,0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-64 mt-4">
              <h3 className="font-semibold text-gray-600 text-sm mb-2">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trend.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} labelFormatter={d => formatDate(d)} />
                  <Line type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#F44336" strokeWidth={2} dot={false} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </div>

      {/* Range Report */}
      <div className="card">
        <h2 className="font-display font-semibold text-gray-700 mb-4">Detailed Report</h2>
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">From</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">To</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadRange} className="btn-primary">Generate Report</button>
          </div>
          {rangeReport && (
            <>
              <button onClick={() => exportBookingsPDF(rangeReport.bookings, `Report ${startDate} to ${endDate}`)} className="btn-secondary text-sm">📄 Bookings PDF</button>
              <button onClick={() => exportBookingsExcel(rangeReport.bookings)} className="btn-secondary text-sm">📊 Bookings Excel</button>
              <button onClick={() => exportExpensesPDF(rangeReport.expenses)} className="btn-secondary text-sm">📄 Expenses PDF</button>
            </>
          )}
        </div>

        {loading && <Spinner />}

        {rangeReport && !loading && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: rangeReport.summary.totalBookings, color: 'text-orange-600' },
                { label: 'Total Revenue', value: formatCurrency(rangeReport.summary.totalRevenue), color: 'text-green-600' },
                { label: 'Pending Dues', value: formatCurrency(rangeReport.summary.totalPending), color: 'text-red-600' },
                { label: 'Total Expenses', value: formatCurrency(rangeReport.summary.totalExpenses), color: 'text-red-500' },
                { label: 'Salary Paid', value: formatCurrency(rangeReport.summary.salaryExpenses), color: 'text-orange-500' },
                { label: 'Advances Paid', value: formatCurrency(rangeReport.summary.advanceExpenses), color: 'text-yellow-600' },
                { label: 'Sir Payments', value: formatCurrency(rangeReport.summary.totalSirPayments), color: 'text-purple-600' },
                { label: 'Net Profit', value: formatCurrency(rangeReport.summary.netProfit), color: rangeReport.summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
                  <div className={`text-xl font-display font-bold mt-1 ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Source Breakdown */}
            {sourceData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-semibold text-gray-600 text-sm mb-3">Bookings by Source</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sourceData} dataKey="bookings" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                          {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-600 text-sm mb-3">Revenue by Source</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip formatter={v => formatCurrency(v)} />
                        <Bar dataKey="revenue" fill="#FF6B2B" radius={[0,4,4,0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
