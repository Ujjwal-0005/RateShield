import React from 'react';
import { Card, CardBody } from '../ui/Card';
import { StatCardSkeleton } from '../ui/Skeleton';

export function AnalyticsCard({ title, value, subtext, icon: Icon, color = 'brand', loading }) {
  if (loading) return <StatCardSkeleton />;

  return (
    <Card padding="md" className={`analytics-card analytics-card--${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-muted font-medium uppercase tracking-wider block">{title}</span>
          <span className="text-2xl font-extrabold text-primary tracking-tight mt-1 block">{value ?? '0'}</span>
          {subtext && <span className="text-xs text-secondary mt-1 block">{subtext}</span>}
        </div>
        {Icon && (
          <div className="analytics-card__icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}
