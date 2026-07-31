import React from 'react';
import { Shield, Eye, Edit2, Trash2, ToggleLeft, ToggleRight, ArrowUpDown } from 'lucide-react';
import { StatusBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TableRowSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/States';

export function PolicyTable({
  policies,
  loading,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  sortField,
  sortOrder,
  onSort,
}) {
  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-40" />;
    return <ArrowUpDown size={12} className="text-brand" />;
  };

  return (
    <div className="table-wrap" role="region" aria-label="Policy list table" tabIndex={0}>
      <table className="data-table" aria-busy={loading}>
        <thead>
          <tr>
            <th scope="col" onClick={() => onSort('name')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-1">
                <span>Policy Name</span>
                {getSortIcon('name')}
              </div>
            </th>
            <th scope="col" onClick={() => onSort('algorithm')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-1">
                <span>Algorithm</span>
                {getSortIcon('algorithm')}
              </div>
            </th>
            <th scope="col" onClick={() => onSort('maxRequests')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-1">
                <span>Request Limit</span>
                {getSortIcon('maxRequests')}
              </div>
            </th>
            <th scope="col">Window Size</th>
            <th scope="col" onClick={() => onSort('isActive')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-1">
                <span>Status</span>
                {getSortIcon('isActive')}
              </div>
            </th>
            <th scope="col">Created Date</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={7} />
          ))}

          {!loading && policies.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  title="No Policies Found"
                  description="No policies match your search or filter parameters."
                />
              </td>
            </tr>
          )}

          {!loading &&
            policies.map((p) => (
              <tr key={p._id} className="data-table__row">
                <td>
                  <div className="table-name-cell">
                    <span className="table-name-cell__icon" aria-hidden="true">
                      <Shield size={14} />
                    </span>
                    <div>
                      <p className="table-name-cell__primary">{p.name}</p>
                      {p.description && <p className="table-name-cell__sub">{p.description}</p>}
                    </div>
                  </div>
                </td>
                <td>
                  <Badge color={p.algorithm === 'sliding' ? 'brand' : p.algorithm === 'fixed' ? 'purple' : 'info'}>
                    {p.algorithm}
                  </Badge>
                </td>
                <td>
                  <span className="table-mono">{p.maxRequests} req</span>
                </td>
                <td>
                  <span className="table-mono">{p.windowSize}s</span>
                </td>
                <td>
                  <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                </td>
                <td>
                  <span className="table-date">
                    {new Date(p.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => onView(p)}
                      title="View Details"
                      aria-label="View Details"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit2}
                      onClick={() => onEdit(p)}
                      title="Edit Policy"
                      aria-label="Edit Policy"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={p.isActive ? ToggleRight : ToggleLeft}
                      onClick={() => onToggleStatus(p)}
                      title={p.isActive ? 'Deactivate Policy' : 'Activate Policy'}
                      aria-label={p.isActive ? 'Deactivate Policy' : 'Activate Policy'}
                      style={{ color: p.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => onDelete(p)}
                      title="Delete Policy"
                      aria-label="Delete Policy"
                      className="text-danger"
                    />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
