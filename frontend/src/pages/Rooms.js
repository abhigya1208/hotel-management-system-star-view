import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { getRoomStatusBg, getRoomStatusBorder } from '../utils/helpers';

const STATUS_OPTIONS = ['vacant', 'occupied', 'ready', 'maintenance'];
const ROOM_TYPES = ['Standard', 'Normal', 'Deluxe', 'Super Deluxe', 'Suite'];

export default function Rooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ roomNumber: '', roomType: 'Deluxe', floor: '', description: '', basePrice: '' });

  const load = async () => {
    try {
      const { data } = await API.get('/rooms');
      setRooms(data.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await API.put(`/rooms/${id}/status`, { status });
      setRooms(rs => rs.map(r => r._id === id ? { ...r, status } : r));
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/rooms', form);
      setRooms(rs => [...rs, data.data]);
      setAddModal(false);
      setForm({ roomNumber: '', roomType: 'Deluxe', floor: '', description: '', basePrice: '' });
      setAlert({ type: 'success', message: 'Room added successfully' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put(`/rooms/${editModal._id}`, form);
      setRooms(rs => rs.map(r => r._id === editModal._id ? data.data : r));
      setEditModal(null);
      setAlert({ type: 'success', message: 'Room updated' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this room?')) return;
    try {
      await API.delete(`/rooms/${id}`);
      setRooms(rs => rs.filter(r => r._id !== id));
      setAlert({ type: 'success', message: 'Room removed' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to remove room' });
    }
  };

  const openEdit = (room) => {
    setForm({ roomNumber: room.roomNumber, roomType: room.roomType, floor: room.floor, description: room.description, basePrice: room.basePrice });
    setEditModal(room);
  };

  const byType = ROOM_TYPES.reduce((acc, t) => { acc[t] = rooms.filter(r => r.roomType === t); return acc; }, {});

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-800">Room Status</h1>
        <div className="flex gap-2">
          <div className="flex gap-2 text-xs">
            {[['vacant','🟢','Vacant'],['occupied','🔴','Occupied'],['ready','🟡','Ready'],['maintenance','⬛','Maint.']].map(([s,e,l])=>(
              <span key={s} className="flex items-center gap-1 text-gray-500">{e} {l}</span>
            ))}
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setAddModal(true)} className="btn-primary text-sm">+ Add Room</button>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Grid view */}
      {Object.entries(byType).map(([type, typeRooms]) => typeRooms.length > 0 && (
        <div key={type}>
          <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> {type} Rooms ({typeRooms.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {typeRooms.map(room => (
              <div
                key={room._id}
                className="rounded-xl border-2 p-3 cursor-pointer hover:shadow-md transition-all relative group"
                style={{ background: getRoomStatusBg(room.status), borderColor: getRoomStatusBorder(room.status) }}
              >
                <div className="font-display font-bold text-gray-800 text-lg">{room.roomNumber}</div>
                <div className="text-xs text-gray-500 mb-1">{room.floor && `Floor: ${room.floor}`}</div>
                <div className="text-xs font-semibold capitalize text-gray-600">{room.status}</div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-white/90 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1 p-2">
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Set Status</div>
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatus(room._id, s)}
                          className={`text-xs px-2 py-1 rounded-lg w-full text-center font-medium ${room.status === s ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </>
                  )}
                  {user?.role === 'admin' && (
                    <div className="flex gap-1 mt-1 w-full">
                      <button onClick={() => openEdit(room)} className="flex-1 text-xs bg-blue-100 text-blue-700 py-1 rounded-lg hover:bg-blue-200">Edit</button>
                      <button onClick={() => handleDelete(room._id)} className="flex-1 text-xs bg-red-100 text-red-700 py-1 rounded-lg hover:bg-red-200">Del</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Room Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Room">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Room Number *</label>
              <input className="input-field" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} required placeholder="e.g. A1, B2" /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Room Type *</label>
              <select className="input-field" value={form.roomType} onChange={e => setForm({ ...form, roomType: e.target.value })}>
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Floor</label>
              <input className="input-field" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} placeholder="Ground, First..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Base Price (₹)</label>
              <input className="input-field" type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} placeholder="1500" /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
            <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Add Room</button>
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Room Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit Room ${editModal?.roomNumber}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Room Number</label>
              <input className="input-field" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Room Type</label>
              <select className="input-field" value={form.roomType} onChange={e => setForm({ ...form, roomType: e.target.value })}>
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Floor</label>
              <input className="input-field" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Base Price (₹)</label>
              <input className="input-field" type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Save Changes</button>
            <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
