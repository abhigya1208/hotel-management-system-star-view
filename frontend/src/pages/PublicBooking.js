import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { formatCurrency } from '../utils/helpers';

export default function PublicBooking() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', numberOfPersons: 1, country: 'Indian', expectedCheckIn: '', bookingDate: new Date().toISOString().split('T')[0] });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/public/rooms', { params: { date: filterDate } });
        setRooms(data.data);
      } catch { }
      setLoading(false);
    };
    load();
  }, [filterDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) { setError('Please select a room first'); return; }
    setSubmitting(true); setError('');
    try {
      const { data } = await API.post('/public/book', { ...form, roomId: selectedRoom._id });
      setSuccess({ bookingId: data.bookingId, room: selectedRoom.roomNumber });
      setSelectedRoom(null);
      setForm({ name: '', phone: '', numberOfPersons: 1, country: 'Indian', expectedCheckIn: '', bookingDate: new Date().toISOString().split('T')[0] });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
    setSubmitting(false);
  };

  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 60);
  const available = rooms.filter(r => r.isAvailable);
  const unavailable = rooms.filter(r => !r.isAvailable);

  const ROOM_TYPE_ICONS = { 'Suite': '🏰', 'Super Deluxe': '⭐⭐', 'Deluxe': '⭐', 'Normal': '🛏️', 'Standard': '🚪' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-10 px-4 text-center shadow-lg">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="font-display text-4xl font-bold mb-2">Hotel Star View</h1>
        <p className="text-orange-100 text-lg">Book your perfect stay — No payment required online</p>
        <div className="mt-4">
          <a href="/login" className="inline-block bg-white text-orange-500 font-semibold px-5 py-2 rounded-full text-sm hover:bg-orange-50 transition-all">Staff Login →</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-8">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="font-display text-2xl font-bold text-green-800 mb-2">Booking Requested!</h2>
            <p className="text-green-700">Your booking for <strong>Room {success.room}</strong> has been submitted.</p>
            <p className="text-green-600 text-sm mt-1">Booking ID: <strong className="font-mono">{success.bookingId}</strong></p>
            <p className="text-gray-500 text-sm mt-2">We will confirm your booking shortly. Please save your Booking ID.</p>
            <button onClick={() => setSuccess(null)} className="mt-4 bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition-all">Make Another Booking</button>
          </div>
        )}

        {/* Date Filter */}
        <div className="card mb-6 flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-gray-700">Check Availability For:</span>
          <input type="date" className="input-field w-40" value={filterDate}
            min={new Date().toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            onChange={e => setFilterDate(e.target.value)} />
          <span className="text-sm text-gray-400">({available.length} rooms available)</span>
        </div>

        {/* Available Rooms Grid */}
        {loading ? (
          <div className="text-center py-12"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-400">Loading rooms...</p></div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-gray-700 mb-4">Available Rooms ({available.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {available.map(room => (
                <div key={room._id}
                  onClick={() => setSelectedRoom(selectedRoom?._id === room._id ? null : room)}
                  className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${selectedRoom?._id === room._id ? 'border-orange-500 shadow-md bg-orange-50' : 'border-gray-100 hover:border-orange-300'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display font-bold text-2xl text-gray-800">Room {room.roomNumber}</div>
                      <div className="text-sm text-orange-500 font-medium">{ROOM_TYPE_ICONS[room.roomType] || '🏨'} {room.roomType}</div>
                    </div>
                    {selectedRoom?._id === room._id && <span className="text-2xl">✅</span>}
                  </div>
                  {room.floor && <div className="text-xs text-gray-400 mb-2">📍 {room.floor} Floor</div>}
                  {room.description && <div className="text-xs text-gray-500 mb-3">{room.description}</div>}
                  <div className="text-xl font-display font-bold text-green-600">{formatCurrency(room.price)} <span className="text-sm font-normal text-gray-400">/ night</span></div>
                  <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Available</div>
                </div>
              ))}
              {available.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <div className="text-4xl mb-3">😔</div>
                  <p className="font-semibold">No rooms available for this date</p>
                  <p className="text-sm mt-1">Please try a different date</p>
                </div>
              )}
            </div>

            {unavailable.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold text-gray-700 mb-4">Unavailable Rooms ({unavailable.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 opacity-60">
                  {unavailable.map(room => (
                    <div key={room._id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                      <div className="font-display font-bold text-2xl text-gray-500">Room {room.roomNumber}</div>
                      <div className="text-sm text-gray-400">{room.roomType}</div>
                      <div className="mt-2 inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">Booked</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Booking Form */}
        {selectedRoom && !success && (
          <div className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <h2 className="font-display text-xl font-bold text-gray-700 mb-1">Complete Your Booking</h2>
            <p className="text-sm text-gray-500 mb-5">Room {selectedRoom.roomNumber} · {selectedRoom.roomType} · {formatCurrency(selectedRoom.price)}/night</p>

            {error && <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-sm mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Phone Number *</label>
                  <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Number of Persons *</label>
                  <input type="number" min="1" max="10" className="input-field" value={form.numberOfPersons} onChange={e => setForm({ ...form, numberOfPersons: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Nationality</label>
                  <input className="input-field" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Indian / Other" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Check-In Date *</label>
                  <input type="date" className="input-field" value={form.bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={maxDate.toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, bookingDate: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Expected Check-In Time</label>
                  <input type="time" className="input-field" value={form.expectedCheckIn} onChange={e => setForm({ ...form, expectedCheckIn: e.target.value })} />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                ⚠️ <strong>Note:</strong> No online payment required. You pay at the hotel at check-in. This is only a booking request — the hotel will confirm your reservation.
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-60">
                  {submitting ? 'Submitting...' : '✓ Request Booking'}
                </button>
                <button type="button" onClick={() => setSelectedRoom(null)} className="btn-secondary px-5 py-3">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 mt-8">
        <div className="text-2xl mb-2">⭐</div>
        <div className="font-display text-gray-600 font-semibold">Hotel Star View</div>
        <div className="mt-1">This site is created and maintained by <span className="text-orange-500 font-medium">Abhigya</span></div>
      </footer>
    </div>
  );
}
