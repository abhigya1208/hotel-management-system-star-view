import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { formatCurrency, formatDate, formatDateTime, bookingStatusColor, isSameDay } from '../utils/helpers';
import { exportBookingsPDF, exportBookingsExcel } from '../utils/exportUtils';

const SOURCES = ['Direct', 'OTA', 'Booking.com', 'Commission', 'Direct Continue', 'OTA Continue', 'Other'];
const MODES = ['Cash', 'UPI', 'Online', 'Mixed'];

const emptyGuest = { name: '', phone: '', country: 'Indian', isLead: false };
const emptyForm = {
  room: '', numberOfPersons: 1, guests: [{ ...emptyGuest, isLead: true }],
  totalAmount: '', paidAmount: '', paymentMode: 'Cash',
  source: 'Direct', sourceCustom: '', notes: '', bookingDate: new Date().toISOString().split('T')[0], status: 'confirmed'
};

export default function Bookings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [guestSuggest, setGuestSuggest] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [webConflict, setWebConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      const [bRes, rRes] = await Promise.all([API.get('/bookings', { params }), API.get('/rooms')]);
      setBookings(bRes.data.data);
      setRooms(rRes.data.data);
    } catch { }
    setLoading(false);
  }, [filterDate, filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (searchParams.get('new')) { setShowModal(true); setEditBooking(null); setForm(emptyForm); } }, [searchParams]);

  const handlePhoneSearch = async (phone, idx) => {
    if (phone.length < 5) { setGuestSuggest([]); return; }
    try {
      const { data } = await API.get('/bookings/search/guest', { params: { phone } });
      setGuestSuggest(data.data);
    } catch { }
  };

  const fillGuest = (suggestion, idx) => {
    const updated = [...form.guests];
    updated[idx] = { ...updated[idx], name: suggestion.name, phone: suggestion.phone, country: suggestion.country || 'Indian' };
    setForm({ ...form, guests: updated });
    setGuestSuggest([]);
  };

  const updateGuest = (idx, field, val) => {
    const updated = [...form.guests];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm({ ...form, guests: updated });
    if (field === 'phone') handlePhoneSearch(val, idx);
  };

  const addGuest = () => setForm({ ...form, guests: [...form.guests, { ...emptyGuest }] });
  const removeGuest = (idx) => setForm({ ...form, guests: form.guests.filter((_, i) => i !== idx) });

  const handleNumberPersons = (n) => {
    const count = parseInt(n) || 1;
    const guests = [...form.guests];
    while (guests.length < count) guests.push({ ...emptyGuest });
    while (guests.length > count) guests.pop();
    setForm({ ...form, numberOfPersons: count, guests });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, remainingAmount: (parseFloat(form.totalAmount) || 0) - (parseFloat(form.paidAmount) || 0) };
      let res;
      if (editBooking) {
        res = await API.put(`/bookings/${editBooking._id}`, payload);
        setBookings(bs => bs.map(b => b._id === editBooking._id ? res.data.data : b));
        setAlert({ type: 'success', message: 'Booking updated!' });
      } else {
        res = await API.post('/bookings', payload);
        setBookings(bs => [res.data.data, ...bs]);
        if (res.data.webBookingConflict) setWebConflict(true);
        setAlert({ type: 'success', message: `Booking ${res.data.data.bookingId} created!` });
      }
      setShowModal(false); setEditBooking(null); setForm(emptyForm);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save booking' });
    }
  };

  const openEdit = (b) => {
    if (user.role === 'manager' && !isSameDay(b.bookingDate)) {
      setAlert({ type: 'error', message: 'Managers can only edit bookings created today.' }); return;
    }
    setEditBooking(b);
    setForm({
      room: b.room?._id || b.room,
      numberOfPersons: b.numberOfPersons,
      guests: b.guests || [emptyGuest],
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
      paymentMode: b.paymentMode,
      source: b.source,
      sourceCustom: b.sourceCustom || '',
      notes: b.notes || '',
      bookingDate: b.bookingDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: b.status,
    });
    setShowModal(true);
  };

  const handleCheckIn = async (id) => {
    try {
      const { data } = await API.put(`/bookings/${id}/checkin`);
      setBookings(bs => bs.map(b => b._id === id ? { ...b, ...data.data } : b));
      setAlert({ type: 'success', message: 'Checked in!' });
    } catch (err) { setAlert({ type: 'error', message: 'Failed' }); }
  };

  const handleCheckOut = async (id) => {
    try {
      const { data } = await API.put(`/bookings/${id}/checkout`);
      setBookings(bs => bs.map(b => b._id === id ? { ...b, ...data.data } : b));
      setAlert({ type: 'success', message: 'Checked out!' });
    } catch (err) { setAlert({ type: 'error', message: 'Failed' }); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const { data } = await API.put(`/bookings/${id}/cancel`);
      setBookings(bs => bs.map(b => b._id === id ? { ...b, ...data.data } : b));
      setAlert({ type: 'success', message: 'Booking cancelled' });
    } catch { setAlert({ type: 'error', message: 'Failed' }); }
  };

  const openNew = () => { setEditBooking(null); setForm(emptyForm); setShowModal(true); };

  const remaining = (parseFloat(form.totalAmount) || 0) - (parseFloat(form.paidAmount) || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-800">Bookings</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" className="input-field w-36 text-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <select className="input-field w-36 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {['pending','confirmed','checkedIn','checkedOut','cancelled','webBooking'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={load} className="btn-secondary text-sm">🔍 Filter</button>
          <button onClick={() => exportBookingsPDF(bookings)} className="btn-secondary text-sm">📄 PDF</button>
          <button onClick={() => exportBookingsExcel(bookings)} className="btn-secondary text-sm">📊 Excel</button>
          {(user.role === 'admin' || user.role === 'manager') && (
            <button onClick={openNew} className="btn-primary">+ New Booking</button>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      {webConflict && (
        <Alert type="warning" message="⚠️ This room has an existing web booking! Confirm before assigning." onClose={() => setWebConflict(false)} />
      )}

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  {['Booking ID','Room','Guest','Phone','Source','Amount','Paid','Remaining','Status','Check-In','Check-Out','Actions'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr><td colSpan={12} className="text-center py-12 text-gray-400">No bookings found</td></tr>
                )}
                {bookings.map(b => (
                  <tr key={b._id} className={`${b.isWebBooking && b.status === 'webBooking' ? 'web-booking-row' : ''} ${b.isRepeatCustomer ? 'repeat-customer' : ''} hover:bg-gray-50`}>
                    <td className="table-td font-mono text-xs">
                      {b.bookingId}
                      {b.isWebBooking && <span className="ml-1 text-amber-500 text-xs">🌐</span>}
                      {b.isRepeatCustomer && <span className="ml-1 text-blue-500 text-xs">🔁</span>}
                    </td>
                    <td className="table-td font-semibold">{b.room?.roomNumber || b.roomNumber}</td>
                    <td className="table-td">{b.guests?.[0]?.name || '—'} {b.numberOfPersons > 1 && <span className="text-xs text-gray-400">+{b.numberOfPersons - 1}</span>}</td>
                    <td className="table-td text-xs">{b.guests?.[0]?.phone || '—'}</td>
                    <td className="table-td text-xs">{b.source}{b.sourceCustom && ` (${b.sourceCustom})`}</td>
                    <td className="table-td">{formatCurrency(b.totalAmount)}</td>
                    <td className="table-td text-green-700 font-medium">{formatCurrency(b.paidAmount)}</td>
                    <td className={`table-td font-medium ${b.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(b.remainingAmount)}</td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bookingStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="table-td text-xs">{b.checkIn ? formatDateTime(b.checkIn) : '—'}</td>
                    <td className="table-td text-xs">{b.checkOut ? formatDateTime(b.checkOut) : '—'}</td>
                    <td className="table-td">
                      <div className="flex gap-1 flex-wrap">
                        {(user.role === 'admin' || user.role === 'manager') && (
                          <>
                            {(b.status === 'confirmed' || b.status === 'pending' || b.status === 'webBooking') && (
                              <button onClick={() => handleCheckIn(b._id)} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">Check-In</button>
                            )}
                            {b.status === 'checkedIn' && (
                              <button onClick={() => handleCheckOut(b._id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200">Check-Out</button>
                            )}
                            <button onClick={() => openEdit(b)} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200">Edit</button>
                            {b.status !== 'cancelled' && b.status !== 'checkedOut' && (
                              <button onClick={() => handleCancel(b._id)} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">Cancel</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editBooking ? `Edit Booking ${editBooking.bookingId}` : 'New Booking'} wide>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stay Details */}
          <div className="bg-orange-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Stay Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Room *</label>
                <select className="input-field" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} required>
                  <option value="">Select Room</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.roomNumber} — {r.roomType} ({r.status})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Booking Date</label>
                <input type="date" className="input-field" value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Source</label>
                <select className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {form.source === 'Other' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Custom Source</label>
                  <input className="input-field" value={form.sourceCustom} onChange={e => setForm({ ...form, sourceCustom: e.target.value })} placeholder="Specify source" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['pending','confirmed','checkedIn','checkedOut','cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Guest Details */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Guest Details</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Persons</label>
                <input type="number" min="1" max="10" className="input-field w-16 text-sm" value={form.numberOfPersons}
                  onChange={e => handleNumberPersons(e.target.value)} />
                <button type="button" onClick={addGuest} className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg">+ Guest</button>
              </div>
            </div>
            <div className="relative">
              {form.guests.map((g, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 mb-2 border border-blue-100">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs font-semibold text-gray-500">Guest {idx + 1}</span>
                    {idx > 0 && <button type="button" onClick={() => removeGuest(idx)} className="ml-auto text-xs text-red-500 hover:text-red-700">Remove</button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <input className="input-field text-sm" placeholder="Name *" value={g.name}
                        onChange={e => updateGuest(idx, 'name', e.target.value)} required={idx === 0} />
                    </div>
                    <div className="relative">
                      <input className="input-field text-sm" placeholder="Phone" value={g.phone}
                        onChange={e => updateGuest(idx, 'phone', e.target.value)} />
                      {idx === 0 && guestSuggest.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                          {guestSuggest.map((s, i) => (
                            <div key={i} onClick={() => fillGuest(s, idx)}
                              className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm flex items-center justify-between">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-xs text-gray-400">{s.phone} 🔁</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <input className="input-field text-sm" placeholder="Country" value={g.country}
                        onChange={e => updateGuest(idx, 'country', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Payment Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Total Amount (₹)</label>
                <input type="number" className="input-field" placeholder="0" value={form.totalAmount}
                  onChange={e => setForm({ ...form, totalAmount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Paid Amount (₹)</label>
                <input type="number" className="input-field" placeholder="0" value={form.paidAmount}
                  onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Remaining (₹)</label>
                <div className={`input-field bg-gray-50 font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(remaining)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Mode</label>
                <select className="input-field" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                  {MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Notes</label>
              <input className="input-field" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editBooking ? 'Update Booking' : 'Create Booking'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
