import React, { useState } from 'react';
import { X, Play, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../api/axiosClient';
import './Modal.css';

export function ApiPlaygroundModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  if (!isOpen) return null;

  const handleSendTestRequest = async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();
    try {
      const res = await api.get('/metrics', {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });
      const duration = Math.round(performance.now() - start);
      setResponse({
        status: res.status,
        statusText: res.statusText,
        allowed: true,
        latencyMs: duration,
        data: res.data,
      });
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      setResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        allowed: err.response?.status !== 429,
        latencyMs: duration,
        data: err.response?.data || { message: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap className="text-brand" size={18} />
            <h3 className="modal-title">API Rate Limiter Playground</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-secondary">
            Simulate incoming API traffic to test live Redis rate limiting headers and status responses.
          </p>

          <Input
            label="API Key (Header: x-api-key)"
            placeholder="rs_live_... (leave empty to use session default)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />

          <div className="flex items-center justify-between p-3 bg-elevated border border-subtle radius-md">
            <div className="flex items-center gap-2 font-mono text-xs text-primary">
              <span className="badge badge--brand">GET</span>
              <span>http://localhost:5000/metrics</span>
            </div>
            <Button variant="primary" size="sm" icon={Play} loading={loading} onClick={handleSendTestRequest}>
              Send Request
            </Button>
          </div>

          {response && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {response.status === 200 || response.status === 201 ? (
                    <span className="badge badge--success flex items-center gap-1">
                      <ShieldCheck size={12} /> {response.status} Allowed
                    </span>
                  ) : response.status === 429 ? (
                    <span className="badge badge--danger flex items-center gap-1">
                      <ShieldAlert size={12} /> 429 Rate Limited
                    </span>
                  ) : (
                    <span className="badge badge--warning">{response.status} {response.statusText}</span>
                  )}
                </div>
                <span className="font-mono text-xs text-muted">{response.latencyMs} ms latency</span>
              </div>

              <pre className="p-3 bg-base border border-subtle radius-md font-mono text-xs text-secondary overflow-x-auto" style={{ maxHeight: '180px' }}>
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>Close Playground</Button>
        </div>
      </div>
    </div>
  );
}
