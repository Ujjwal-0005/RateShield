import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { EmptyState } from '../ui/States';
import { TableRowSkeleton } from '../ui/Skeleton';
import './EventTable.css';

export function EventTable({ events = [], loading }) {
  return (
    <Card padding="none" className="event-table-card">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-warning" />
            <span>Recent Rate Limit & Access Events</span>
          </div>
        }
        description="Audit log stream of rate limiter evaluations"
      />

      <div className="table-wrap">
        <table className="data-table" aria-busy={loading}>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">API Key Token</th>
              <th scope="col">Policy</th>
              <th scope="col">Target Endpoint</th>
              <th scope="col">Decision</th>
              <th scope="col">Reason / Header</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}

            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="No Rate Limit Events Recorded"
                    description="Incoming traffic has not exceeded policy request limits."
                  />
                </td>
              </tr>
            )}

            {!loading &&
              events.map((evt, idx) => (
                <tr key={evt.id || idx} className="data-table__row">
                  <td>
                    <span className="table-date font-mono">
                      {new Date(evt.timestamp || Date.now() - idx * 120000).toLocaleTimeString()}
                    </span>
                  </td>
                  <td>
                    <code className="table-mono text-primary font-bold">
                      {evt.apiKey || 'rs_live_...4a1f'}
                    </code>
                  </td>
                  <td>
                    <span className="table-policy">{evt.policyName || 'Standard Policy'}</span>
                  </td>
                  <td>
                    <code className="table-mono text-secondary">{evt.endpoint || '/api/v1/resource'}</code>
                  </td>
                  <td>
                    {evt.status === 429 || evt.allowed === false ? (
                      <span className="badge badge--danger flex items-center gap-1 w-fit">
                        <ShieldAlert size={12} /> 429 Blocked
                      </span>
                    ) : (
                      <span className="badge badge--success flex items-center gap-1 w-fit">
                        <ShieldCheck size={12} /> 200 Allowed
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-muted">
                      {evt.reason || 'Token bucket exhausted'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
