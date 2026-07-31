import React from 'react';
import { X, ShieldAlert, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import { CopyButton } from '../ui/CopyButton';
import '../modals/Modal.css';

export function SecureKeyDialog({ isOpen, onClose, rawKey, title = 'API Key Generated' }) {
  if (!isOpen || !rawKey) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Key className="text-purple" size={18} />
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="p-3 bg-danger-muted border border-danger radius-md flex items-start gap-2">
            <ShieldAlert size={18} className="text-danger flex-shrink-0 mt-0.5" />
            <div className="text-xs text-danger leading-relaxed">
              <strong>Important Security Notice:</strong> This raw API Key will <u>never</u> be displayed again in plaintext. Please copy and store it securely in your secrets manager.
            </div>
          </div>

          <div className="mt-2">
            <label className="input-label mb-1 block text-xs">Secret Key Token</label>
            <div className="flex items-center gap-2 p-3 bg-elevated border border-subtle radius-md">
              <code className="font-mono text-sm text-primary flex-1 break-all select-all font-bold">
                {rawKey}
              </code>
              <CopyButton text={rawKey} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="primary" onClick={onClose}>
            I Have Saved My Secret Key
          </Button>
        </div>
      </div>
    </div>
  );
}
