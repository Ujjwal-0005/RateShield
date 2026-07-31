import React from 'react';
import { X, Key, Shield, Activity, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge, Badge } from '../ui/Badge';
import { CopyButton } from '../ui/CopyButton';
import '../modals/Modal.css';

export function ApiKeyDetailsModal({ isOpen, onClose, apiKey }) {
  if (!isOpen || !apiKey) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Key className="text-purple" size={18} />
            <h3 className="modal-title">API Key Metadata Details</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div>
              <h4 className="text-base font-semibold text-primary">{apiKey.name}</h4>
              <p className="text-xs text-secondary mt-1">{apiKey.description || 'No description provided.'}</p>
            </div>
            <StatusBadge status={apiKey.status} />
          </div>

          <div className="p-3 bg-elevated border border-subtle radius-md flex items-center justify-between">
            <code className="font-mono text-xs text-primary font-bold">{apiKey.maskedKey || '••••••••'}</code>
            <CopyButton text={apiKey.maskedKey} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="p-3 bg-elevated border border-subtle radius-md">
              <span className="text-xs text-muted font-medium uppercase block">Bound Policy</span>
              <div className="mt-1 flex items-center gap-1">
                <Shield size={13} className="text-brand" />
                <span className="text-xs font-semibold text-primary">{apiKey.policy?.name || 'Default Tier'}</span>
              </div>
            </div>

            <div className="p-3 bg-elevated border border-subtle radius-md">
              <span className="text-xs text-muted font-medium uppercase block">Environment</span>
              <div className="mt-1">
                <Badge color={apiKey.keyType === 'live' ? 'success' : 'info'}>
                  {apiKey.keyType}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-subtle text-xs text-secondary">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total Requests Processed</span>
              <span className="font-mono font-bold text-primary">{apiKey.usageCount ?? 0} req</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Last Used</span>
              <span>{apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : 'Never'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Created Date</span>
              <span>{new Date(apiKey.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Expiration Date</span>
              <span>{apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never (Permanent)'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
