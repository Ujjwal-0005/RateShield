import React, { useState, useEffect } from 'react';
import { X, Key, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiKeyService } from '../../services/apiKeyService';
import { policyService } from '../../services/policyService';
import { useToast } from '../ui/Toast';
import '../modals/Modal.css';

export function ApiKeyFormModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [keyType, setKeyType] = useState('live');
  const [expiresAt, setExpiresAt] = useState('');

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      policyService.getAll()
        .then(({ data }) => {
          const list = data?.policies || (Array.isArray(data) ? data : []);
          setPolicies(list);
          if (list.length > 0 && !policyId) setPolicyId(list[0]._id);
        })
        .catch(() => {});

      setName('');
      setDescription('');
      setKeyType('live');
      setExpiresAt('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Key identifier name is required';
    if (!policyId) errs.policy = 'Select a rate limiting policy';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      policy: policyId,
      keyType,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    try {
      const res = await apiKeyService.create(payload);
      const data = res.data?.data || res.data;
      const generatedKey = data.rawKey || data.key || 'rs_live_generatedkey';
      addToast(`API Key "${name}" created successfully`, 'success');
      onSuccess?.(generatedKey);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create API Key.';
      setErrors({ form: msg });
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Key className="text-purple" size={18} />
            <h3 className="modal-title">Create API Key</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.form && (
              <div className="input-error p-3 bg-danger-muted border border-danger radius-md text-xs">
                {errors.form}
              </div>
            )}

            <Input
              label="Key Identifier Name"
              placeholder="e.g., Stripe Webhook Relay Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g., Production key for payment integration"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="modal-select-wrapper">
              <label className="input-label">Assigned Rate Limit Policy</label>
              <select
                className="modal-select"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
              >
                {policies.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.maxRequests} req / {p.windowSize}s - {p.algorithm})
                  </option>
                ))}
                {policies.length === 0 && <option value="">No active policies found</option>}
              </select>
              {errors.policy && <span className="input-error mt-1">{errors.policy}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="modal-select-wrapper">
                <label className="input-label">Environment</label>
                <select
                  className="modal-select"
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                >
                  <option value="live">Live (Production)</option>
                  <option value="test">Test (Sandbox)</option>
                </select>
              </div>

              <Input
                label="Expiration Date (Optional)"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={Plus} loading={loading}>
              Generate API Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
