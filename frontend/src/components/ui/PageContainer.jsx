import React from 'react';
import './PageContainer.css';

export function PageContainer({ children, className = '' }) {
  return (
    <div className={`page-container fade-in ${className}`}>
      {children}
    </div>
  );
}
