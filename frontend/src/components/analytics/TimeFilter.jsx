import React from 'react';
import { Calendar } from 'lucide-react';
import './TimeFilter.css';

const TIME_RANGES = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
];

export function TimeFilter({ value, onChange }) {
  return (
    <div className="time-filter" role="radiogroup" aria-label="Select time range">
      <div className="time-filter__icon-wrap">
        <Calendar size={14} className="text-muted" />
      </div>
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          role="radio"
          aria-checked={value === range.value}
          className={`time-filter__btn ${value === range.value ? 'time-filter__btn--active' : ''}`}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
