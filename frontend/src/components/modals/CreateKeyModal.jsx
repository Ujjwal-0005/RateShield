import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiKeyService } from '../../services/apiKeyService';
import { policyService } from '../../services/policyService';
import './Modal.css';

export function CreateKeyModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [keyType, setKeyType] = useState('live');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      policyService.getAll()
        .then(({ data }) => {
          const list = data?.policies || data || [];
          setPolicies(list);
          if (list.length > 0) setPolicyId(list[0]._id);
        })
        .catch(() => {});
    } else {
      setCreatedKey(null);
      setName('');
      setError('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Key name is required');
      return;
    }
    if (!policyId) {
      setError('Select an active policy');
      return;
    }

    setLoading(true);
    try {
      const res = await apiKeyService.create({
        name,
        policy: policyId,
        keyType,
      });
      const data = res.data?.data || res.data;
      setCreatedKey(data.rawKey || data.key || 'rs_live_samplekeygenerated');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Key className="text-purple" size={18} />
            <h3 className="modal-title">{createdKey ? 'API Key Generated' : 'Create API Key'}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {createdKey ? (
          <div className="modal-body">
            <p className="text-sm text-secondary">
              Save this key now! For security, it will not be displayed again in plaintext.
            </p>
            <div className="flex items-center gap-2 p-3 bg-elevated border border-subtle radius-md">
              <code className="font-mono text-sm text-primary flex-1 break-all">{createdKey}</code>
              <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="modal-footer mt-4">
              <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="input-error mb-2">{error}</div>}

              <Input
                label="Key Identifier Name"
                placeholder="e.g., Stripe Gateway Service Key"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="modal-select-wrapper">
                <label className="input-label">Assign Policy</label>
                <select
                  className="modal-select"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                >
                  {policies.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.maxRequests} req / {p.windowSize}s)
                    </option>
                  ))}
                  {policies.length === 0 && <option value="">No policies available</option>}
                </select>
              </div>

              <div className="modal-select-wrapper">
                <label className="input-label">Environment Type</label>
                <select
                  className="modal-select"
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                >
                  <option value="live">Live (Production)</option>
                  <option value="test">Test (Sandbox)</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
              <Button variant="primary" type="submit" icon={Plus} loading={loading}>
                Generate Key
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
