export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const statusColor = (status) => ({
  vacant: 'badge-vacant',
  occupied: 'badge-occupied',
  ready: 'badge-ready',
  maintenance: 'badge-maintenance',
}[status] || 'badge-vacant');

export const bookingStatusColor = (status) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checkedIn: 'bg-green-100 text-green-800',
  checkedOut: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
  webBooking: 'bg-amber-100 text-amber-800',
}[status] || 'bg-gray-100 text-gray-700');

export const isSameDay = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return new Date(date).toDateString() === yesterday.toDateString();
};

export const getRoomStatusBg = (status) => ({
  vacant: '#dcfce7',
  occupied: '#fee2e2',
  ready: '#fef9c3',
  maintenance: '#e5e7eb',
}[status] || '#f3f4f6');

export const getRoomStatusBorder = (status) => ({
  vacant: '#16a34a',
  occupied: '#dc2626',
  ready: '#ca8a04',
  maintenance: '#6b7280',
}[status] || '#9ca3af');
