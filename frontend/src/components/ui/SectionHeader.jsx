import React from 'react';
import './SectionHeader.css';

export function SectionHeader({ title, description, action, className = '' }) {
  return (
    <div className={`section-header ${className}`}>
      <div className="section-header__info">
        {title && <h2 className="section-header__title">{title}</h2>}
        {description && <p className="section-header__desc">{description}</p>}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  );
}
