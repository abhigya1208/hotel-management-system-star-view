import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { formatDateTime } from '../utils/helpers';

const emptyForm = { name: '', username: '', password: '', role: 'manager' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get('/auth/users');
        setUsers(data.data);
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const payload = { name: form.name, role: form.role, active: form.active };
        if (form.password) payload.password = form.password;
        const { data } = await API.put(`/auth/users/${editUser._id}`, payload);
        setUsers(us => us.map(u => u._id === editUser._id ? { ...u, ...data.data } : u));
        setAlert({ type: 'success', message: 'User updated' });
      } else {
        const { data } = await API.post('/auth/users', form);
        setUsers(us => [...us, data.data]);
        setAlert({ type: 'success', message: 'User created' });
      }
      setShowModal(false); setEditUser(null); setForm(emptyForm);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/auth/users/${id}`);
      setUsers(us => us.filter(u => u._id !== id));
      setAlert({ type: 'success', message: 'User deleted' });
    } catch { setAlert({ type: 'error', message: 'Failed' }); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, username: u.username, password: '', role: u.role, active: u.active });
    setShowModal(true);
  };

  const roleColor = { admin: 'bg-red-100 text-red-700', manager: 'bg-orange-100 text-orange-700', leaser: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-800">User Management</h1>
        <button onClick={() => { setEditUser(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary">+ Add User</button>
      </div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr>
              {['Name', 'Username', 'Role', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="table-td font-semibold">{u.name}</td>
                  <td className="table-td text-gray-500 font-mono text-sm">@{u.username}</td>
                  <td className="table-td"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[u.role]}`}>{u.role}</span></td>
                  <td className="table-td"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="table-td text-xs text-gray-400">{formatDateTime(u.createdAt)}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200">Edit</button>
                      <button onClick={() => handleDelete(u._id)} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditUser(null); setForm(emptyForm); }} title={editUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Full Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Username *</label>
              <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required disabled={!!editUser} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Role *</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {['admin', 'manager', 'leaser'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} />
          </div>
          {editUser && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active" className="text-sm text-gray-600">Active</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Create User'}</button>
            <button type="button" onClick={() => { setShowModal(false); setEditUser(null); setForm(emptyForm); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
