import React from 'react';
import { Card, CardHeader, CardBody } from './Card';

export function DashboardCard({ title, description, action, children, className = '', padding = 'md' }) {
  return (
    <Card padding="none" className={`dashboard-card ${className}`}>
      {(title || description || action) && (
        <CardHeader title={title} description={description} action={action} />
      )}
      <CardBody className={padding === 'none' ? 'card-body--no-pad' : ''}>
        {children}
      </CardBody>
    </Card>
  );
}
