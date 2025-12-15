import React from 'react';

interface GaugeProps {
  value: number; // 0.0 to 1.0
  label: string;
}

export const Gauge: React.FC<GaugeProps> = ({ value, label }) => {
  const percentage = Math.round(value * 100);
  
  const strokeColor = 
    percentage >= 80 ? "#22c55e" : 
    percentage >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200 stroke-current"
            strokeWidth="10"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
          ></circle>
          <circle
            className="transition-all duration-1000 ease-out"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * percentage) / 100}
            transform="rotate(-90 50 50)"
          ></circle>
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: strokeColor }}>{percentage}%</span>
          <span className="text-xs text-slate-400">SOH</span>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-700">{label}</h3>
    </div>
  );
};