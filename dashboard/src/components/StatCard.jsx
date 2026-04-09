import React from 'react';

export default function StatCard({ icon: Icon, label, value, accent = 'cyan' }) {
  return (
    <div className="glass stat-card">
      <div className={`stat-card-icon ${accent}`}>
        <Icon size={17} strokeWidth={2} />
      </div>
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
      </div>
    </div>
  );
}
