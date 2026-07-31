import React, { useState } from 'react';
import { X, Shield, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { policyService } from '../../services/policyService';
import './Modal.css';

export function CreatePolicyModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [algorithm, setAlgorithm] = useState('sliding');
  const [maxRequests, setMaxRequests] = useState('100');
  const [windowSize, setWindowSize] = useState('60');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Policy name is required');
      return;
    }

    setLoading(true);
    try {
      await policyService.create({
        name,
        description,
        algorithm,
        maxRequests: parseInt(maxRequests, 10),
        windowSize: parseInt(windowSize, 10),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create policy.');
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
            <h3 className="modal-title">Create Policy</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="input-error mb-2">{error}</div>}

            <Input
              label="Policy Name"
              placeholder="e.g., Tier 1 Basic Limits"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Description"
              placeholder="e.g., Standard rate limiting policy for standard clients"
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
                value={maxRequests}
                onChange={(e) => setMaxRequests(e.target.value)}
                required
              />
              <Input
                label="Window Size (seconds)"
                type="number"
                value={windowSize}
                onChange={(e) => setWindowSize(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" icon={Plus} loading={loading}>
              Create Policy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
