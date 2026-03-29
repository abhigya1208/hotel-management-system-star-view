import React from 'react';

export default function Alert({ type = 'info', message, onClose }) {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]} mb-4`}>
      <span>{icons[type]}</span>
      <span className="flex-1 text-sm">{message}</span>
      {onClose && <button onClick={onClose} className="text-lg leading-none opacity-60 hover:opacity-100">×</button>}
    </div>
  );
}
