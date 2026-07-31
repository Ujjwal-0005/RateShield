import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { policyService } from '../../services/policyService';
import { useToast } from '../ui/Toast';
import '../modals/Modal.css';

export function PolicyFormModal({ isOpen, onClose, policy = null, onSuccess }) {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [algorithm, setAlgorithm] = useState('sliding');
  const [maxRequests, setMaxRequests] = useState('100');
  const [windowSize, setWindowSize] = useState('60');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(policy);

  useEffect(() => {
    if (isOpen) {
      if (policy) {
        setName(policy.name || '');
        setDescription(policy.description || '');
        setAlgorithm(policy.algorithm || 'sliding');
        setMaxRequests(String(policy.maxRequests || 100));
        setWindowSize(String(policy.windowSize || 60));
      } else {
        setName('');
        setDescription('');
        setAlgorithm('sliding');
        setMaxRequests('100');
        setWindowSize('60');
      }
      setErrors({});
    }
  }, [isOpen, policy]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Policy name is required';
    if (!maxRequests || isNaN(maxRequests) || Number(maxRequests) <= 0) {
      errs.maxRequests = 'Max requests must be a positive integer';
    }
    if (!windowSize || isNaN(windowSize) || Number(windowSize) <= 0) {
      errs.windowSize = 'Window size must be a positive integer';
    }
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
      algorithm,
      maxRequests: parseInt(maxRequests, 10),
      windowSize: parseInt(windowSize, 10),
    };

    try {
      if (isEdit) {
        await policyService.update(policy._id, payload);
        addToast(`Policy "${name}" updated successfully`, 'success');
      } else {
        await policyService.create(payload);
        addToast(`Policy "${name}" created successfully`, 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} policy.`;
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
            <Shield className="text-brand" size={18} />
            <h3 className="modal-title">{isEdit ? 'Edit Policy' : 'Create Policy'}</h3>
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
              label="Policy Name"
              placeholder="e.g., Enterprise High Throughput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <Input
              label="Description"
              placeholder="e.g., Higher allowance for premium API clients"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="modal-select-wrapper">
              <label className="input-label">Rate Limiting Algorithm</label>
              <select
                className="modal-select"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
              >
                <option value="sliding">Sliding Window (Recommended)</option>
                <option value="fixed">Fixed Window</option>
                <option value="token_bucket">Token Bucket</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Max Requests"
                type="number"
                min="1"
                value={maxRequests}
                onChange={(e) => setMaxRequests(e.target.value)}
                error={errors.maxRequests}
                required
              />
              <Input
                label="Window Size (seconds)"
                type="number"
                min="1"
                value={windowSize}
                onChange={(e) => setWindowSize(e.target.value)}
                error={errors.windowSize}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={isEdit ? Edit2 : Plus} loading={loading}>
              {isEdit ? 'Save Changes' : 'Create Policy'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
