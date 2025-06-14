import React from 'react';

const StatsCard = ({ icon: Icon, value, label, color = 'primary' }) => {
  return (
    <div className={
      `relative z-10 bg-surface hover:bg-surface rounded shadow-card p-6 flex flex-col items-center reveal-card hover-lift transition-shadow transition-transform duration-300`
    }>
      <div className={`p-3 bg-${color}-700 rounded-full mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-3xl font-semibold text-white">{value}</h3>
      <p className={`text-sm text-${color}-50 mt-1`}>{label}</p>
    </div>
  );
};

export default StatsCard; 