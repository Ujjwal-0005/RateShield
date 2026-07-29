import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

export function SearchBar({ value, onChange, placeholder = 'Search policies...' }) {
  return (
    <div className="search-bar">
      <Search size={15} className="search-bar__icon" aria-hidden="true" />
      <input
        type="text"
        className="search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
