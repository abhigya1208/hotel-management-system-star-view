import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { formatCurrency, formatDate, formatDateTime, isSameDay } from '../utils/helpers';
import { exportExpensesPDF, exportExpensesExcel } from '../utils/exportUtils';

const EXPENSE_CATS = ['Salary', 'Staff Advance', 'Laundry', 'Repair', 'Utilities', 'Food', 'Other'];
const MODES = ['Cash', 'UPI', 'Online'];

const emptyForm = { category: 'Salary', categoryCustom: '', amount: '', description: '', personName: '', paymentMode: 'Cash', date: new Date().toISOString().split('T')[0] };
const emptySirForm = { amount: '', description: '', paymentMode: 'Cash', date: new Date().toISOString().split('T')[0] };

export default function Expenses() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [sirPayments, setSirPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [tab, setTab] = useState('expenses');
  const [showModal, setShowModal] = useState(false);
  const [showSirModal, setShowSirModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [sirForm, setSirForm] = useState(emptySirForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([API.get('/expenses'), API.get('/sir-payments')]);
      setExpenses(eRes.data.data);
      setSirPayments(sRes.data.data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (searchParams.get('new')) setShowModal(true); }, [searchParams]);

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const { data } = await API.put(`/expenses/${editItem._id}`, form);
        setExpenses(es => es.map(e => e._id === editItem._id ? data.data : e));
        setAlert({ type: 'success', message: 'Expense updated' });
      } else {
        const { data } = await API.post('/expenses', form);
        setExpenses(es => [data.data, ...es]);
        setAlert({ type: 'success', message: 'Expense recorded' });
      }
      setShowModal(false); setEditItem(null); setForm(emptyForm);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleSirSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/sir-payments', sirForm);
      setSirPayments(ps => [data.data, ...ps]);
      setAlert({ type: 'success', message: 'Sir payment recorded' });
      setShowSirModal(false); setSirForm(emptySirForm);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed' });
    }
  };

  const openEdit = (item) => {
    if (user.role === 'manager' && !isSameDay(item.date)) {
      setAlert({ type: 'error', message: 'Managers can only edit today\'s records.' }); return;
    }
    setEditItem(item);
    setForm({ category: item.category, categoryCustom: item.categoryCustom || '', amount: item.amount, description: item.description || '', personName: item.personName || '', paymentMode: item.paymentMode, date: item.date?.split('T')[0] });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await API.delete(`/expenses/${id}`);
      setExpenses(es => es.filter(e => e._id !== id));
      setAlert({ type: 'success', message: 'Deleted' });
    } catch { setAlert({ type: 'error', message: 'Only admin can delete' }); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSalary = expenses.filter(e => e.category === 'Salary').reduce((s, e) => s + e.amount, 0);
  const totalAdvance = expenses.filter(e => e.category === 'Staff Advance').reduce((s, e) => s + e.amount, 0);
  const totalSir = sirPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-800">Finance</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportExpensesPDF(expenses)} className="btn-secondary text-sm">📄 PDF</button>
          <button onClick={() => exportExpensesExcel(expenses)} className="btn-secondary text-sm">📊 Excel</button>
          {(user.role === 'admin' || user.role === 'manager') && (
            <>
              <button onClick={() => { setEditItem(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary">+ Expense</button>
              <button onClick={() => setShowSirModal(true)} className="bg-purple-500 hover:bg-purple-600 text-white font-medium px-4 py-2 rounded-lg text-sm">+ Sir Payment</button>
            </>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: '💸', color: 'bg-red-50 border-red-100 text-red-700' },
          { label: 'Salary Paid', value: formatCurrency(totalSalary), icon: '👷', color: 'bg-orange-50 border-orange-100 text-orange-700' },
          { label: 'Staff Advance', value: formatCurrency(totalAdvance), icon: '💳', color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
          { label: 'Sir Payments', value: formatCurrency(totalSir), icon: '🤝', color: 'bg-purple-50 border-purple-100 text-purple-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{c.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{c.label}</span>
            </div>
            <div className="text-2xl font-display font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['expenses', 'sirPayments'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'expenses' ? '💸 Expenses' : '🤝 Sir Payments'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'expenses' ? (
              <table className="w-full min-w-[700px]">
                <thead><tr>
                  {['Date', 'Category', 'Person', 'Amount', 'Mode', 'Description', 'By', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}
                </tr></thead>
                <tbody>
                  {expenses.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No expenses recorded</td></tr>}
                  {expenses.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="table-td text-xs">{formatDate(e.date)}</td>
                      <td className="table-td"><span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">{e.category}</span></td>
                      <td className="table-td text-sm">{e.personName || '—'}</td>
                      <td className="table-td font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="table-td text-xs">{e.paymentMode}</td>
                      <td className="table-td text-xs text-gray-500">{e.description || '—'}</td>
                      <td className="table-td text-xs text-gray-400">{e.createdBy?.name || '—'}</td>
                      <td className="table-td">
                        {(user.role === 'admin' || (user.role === 'manager' && isSameDay(e.date))) && (
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(e)} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200">Edit</button>
                            {user.role === 'admin' && <button onClick={() => handleDelete(e._id)} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">Del</button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead><tr>
                  {['Date', 'Amount', 'Mode', 'Description', 'By'].map(h => <th key={h} className="table-th">{h}</th>)}
                </tr></thead>
                <tbody>
                  {sirPayments.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No sir payments recorded</td></tr>}
                  {sirPayments.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="table-td text-xs">{formatDate(p.date)}</td>
                      <td className="table-td font-semibold text-purple-700">{formatCurrency(p.amount)}</td>
                      <td className="table-td text-xs">{p.paymentMode}</td>
                      <td className="table-td text-xs text-gray-500">{p.description || '—'}</td>
                      <td className="table-td text-xs text-gray-400">{p.createdBy?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); setForm(emptyForm); }} title={editItem ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleExpSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Category *</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {form.category === 'Other' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Specify</label>
                <input className="input-field" value={form.categoryCustom} onChange={e => setForm({ ...form, categoryCustom: e.target.value })} />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Person Name</label>
              <input className="input-field" placeholder="Labour/staff name" value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount (₹) *</label>
              <input type="number" className="input-field" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Mode</label>
              <select className="input-field" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
            <input className="input-field" placeholder="Optional notes..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Add Expense'}</button>
            <button type="button" onClick={() => { setShowModal(false); setEditItem(null); setForm(emptyForm); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Sir Payment Modal */}
      <Modal open={showSirModal} onClose={() => setShowSirModal(false)} title="Record Sir Payment">
        <form onSubmit={handleSirSubmit} className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-700">
            ⚠️ Sir payments are tracked separately and NOT included in expense reports.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount (₹) *</label>
              <input type="number" className="input-field" value={sirForm.amount} onChange={e => setSirForm({ ...sirForm, amount: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Mode</label>
              <select className="input-field" value={sirForm.paymentMode} onChange={e => setSirForm({ ...sirForm, paymentMode: e.target.value })}>
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date</label>
              <input type="date" className="input-field" value={sirForm.date} onChange={e => setSirForm({ ...sirForm, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
            <input className="input-field" value={sirForm.description} onChange={e => setSirForm({ ...sirForm, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white font-medium px-4 py-2 rounded-lg">Record Payment</button>
            <button type="button" onClick={() => setShowSirModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
