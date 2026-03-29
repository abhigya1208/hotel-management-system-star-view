import React from 'react';

export default function StatCard({ title, value, sub, icon, color = 'orange' }) {
  const colors = {
    orange: 'from-orange-400 to-orange-500',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-400 to-blue-500',
    red: 'from-red-400 to-red-500',
    purple: 'from-purple-400 to-purple-500',
    amber: 'from-amber-400 to-amber-500',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${colors[color] || colors.orange}`} />
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-display font-bold text-gray-800 mt-1">{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color] || colors.orange} flex items-center justify-center text-2xl shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
