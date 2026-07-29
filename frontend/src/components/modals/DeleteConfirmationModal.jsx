import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import '../modals/Modal.css';

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header" style={{ borderBottomColor: 'var(--color-danger-muted)' }}>
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <h3 className="modal-title text-danger">{title || 'Confirm Delete'}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-secondary">
            {message || 'Are you sure you want to delete this resource? This action cannot be undone.'}
          </p>
        </div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" icon={Trash2} loading={loading} onClick={onConfirm}>
            Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
