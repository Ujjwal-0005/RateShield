import React from 'react';
import { Key, Eye, RefreshCw, ToggleLeft, ToggleRight, Trash2, ArrowUpDown } from 'lucide-react';
import { StatusBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CopyButton } from '../ui/CopyButton';
import { TableRowSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/States';

export function ApiKeyTable({
  apiKeys,
  loading,
  onView,
  onRegenerate,
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
    <div className="table-wrap" role="region" aria-label="API Keys table" tabIndex={0}>
      <table className="data-table" aria-busy={loading}>
        <thead>
          <tr>
            <th scope="col" onClick={() => onSort('name')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-1">
                <span>Key Name</span>
                {getSortIcon('name')}
              </div>
            </th>
            <th scope="col">Masked Token</th>
            <th scope="col">Policy</th>
            <th scope="col">Environment</th>
            <th scope="col" onClick={() => onSort('status')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-1">
                <span>Status</span>
                {getSortIcon('status')}
              </div>
            </th>
            <th scope="col">Usage Count</th>
            <th scope="col">Last Used</th>
            <th scope="col">Created Date</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={9} />
          ))}

          {!loading && apiKeys.length === 0 && (
            <tr>
              <td colSpan={9}>
                <EmptyState
                  title="No API Keys Found"
                  description="No client keys match your search or filter options."
                />
              </td>
            </tr>
          )}

          {!loading &&
            apiKeys.map((k) => (
              <tr key={k._id} className="data-table__row">
                <td>
                  <div className="table-name-cell">
                    <span className="table-name-cell__icon" aria-hidden="true">
                      <Key size={14} />
                    </span>
                    <div>
                      <p className="table-name-cell__primary">{k.name}</p>
                      {k.description && <p className="table-name-cell__sub">{k.description}</p>}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="key-cell">
                    <code className="table-mono table-mono--key">{k.maskedKey || '••••••••'}</code>
                    <CopyButton text={k.maskedKey} size="sm" variant="ghost" />
                  </div>
                </td>
                <td>
                  <span className="table-policy">{k.policy?.name || '—'}</span>
                </td>
                <td>
                  <Badge color={k.keyType === 'live' ? 'success' : 'info'}>
                    {k.keyType}
                  </Badge>
                </td>
                <td>
                  <StatusBadge status={k.status} />
                </td>
                <td>
                  <span className="table-mono">{k.usageCount ?? 0} req</span>
                </td>
                <td>
                  <span className="table-date">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                  </span>
                </td>
                <td>
                  <span className="table-date">
                    {new Date(k.createdAt).toLocaleDateString('en-US', {
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
                      onClick={() => onView(k)}
                      title="View Metadata"
                      aria-label="View Metadata"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RefreshCw}
                      onClick={() => onRegenerate(k)}
                      title="Regenerate Key Token"
                      aria-label="Regenerate Key Token"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={k.status === 'active' ? ToggleRight : ToggleLeft}
                      onClick={() => onToggleStatus(k)}
                      title={k.status === 'active' ? 'Disable Key' : 'Enable Key'}
                      aria-label={k.status === 'active' ? 'Disable Key' : 'Enable Key'}
                      style={{ color: k.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => onDelete(k)}
                      title="Revoke & Delete Key"
                      aria-label="Revoke & Delete Key"
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
