import React from 'react';

export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-400">{text}</span>
    </div>
  );
}
