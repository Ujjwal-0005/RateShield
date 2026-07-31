import React from 'react';
import { X, Shield, Clock, Activity, CheckCircle2, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge, Badge } from '../ui/Badge';
import '../modals/Modal.css';

export function PolicyDetailsModal({ isOpen, onClose, policy }) {
  if (!isOpen || !policy) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Shield className="text-brand" size={18} />
            <h3 className="modal-title">Policy Details</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div>
              <h4 className="text-base font-semibold text-primary">{policy.name}</h4>
              <p className="text-xs text-secondary mt-1">{policy.description || 'No description provided.'}</p>
            </div>
            <StatusBadge status={policy.isActive ? 'active' : 'inactive'} />
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="p-3 bg-elevated border border-subtle radius-md">
              <span className="text-xs text-muted font-medium uppercase block">Algorithm</span>
              <div className="mt-1">
                <Badge color={policy.algorithm === 'sliding' ? 'brand' : 'purple'}>
                  {policy.algorithm}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-elevated border border-subtle radius-md">
              <span className="text-xs text-muted font-medium uppercase block">Request Capacity</span>
              <span className="font-mono text-sm text-primary font-bold mt-1 block">
                {policy.maxRequests} req / {policy.windowSize}s
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-subtle text-xs text-secondary">
            <div className="flex items-center justify-between">
              <span className="text-muted">Policy ID</span>
              <code className="font-mono text-primary">{policy._id}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Created At</span>
              <span>{new Date(policy.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Last Updated</span>
              <span>{new Date(policy.updatedAt || policy.createdAt).toLocaleString()}</span>
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
