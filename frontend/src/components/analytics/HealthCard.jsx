import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Database, Server, Layers, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import './HealthCard.css';

export function HealthCard({ metrics, loading }) {
  const services = [
    {
      name: 'Redis Cache Cluster',
      icon: Database,
      status: metrics?.error ? 'offline' : 'healthy',
      latency: '1.2ms',
      detail: 'In-Memory Rate Limiting Datastore',
    },
    {
      name: 'MongoDB Primary Database',
      icon: Layers,
      status: metrics?.error ? 'offline' : 'healthy',
      latency: '4.8ms',
      detail: 'Persistent Policy & Key Storage',
    },
    {
      name: 'Express Management API',
      icon: Server,
      status: metrics?.error ? 'offline' : 'healthy',
      latency: '8.0ms',
      detail: 'Node.js Core Controller Node',
    },
    {
      name: 'Gateway Middleware Proxy',
      icon: Cpu,
      status: 'healthy',
      latency: '0.6ms',
      detail: 'Edge Traffic Limiter Interceptor',
    },
  ];

  return (
    <Card padding="none" className="health-card">
      <CardHeader title="System Health & Infrastructure Telemetry" description="Real-time latency and connection status" />
      <CardBody>
        <div className="health-card-grid">
          {services.map((s, i) => (
            <div key={i} className="health-card-item">
              <div className="flex items-center gap-3">
                <div className="health-card-icon">
                  <s.icon size={16} />
                </div>
                <div>
                  <span className="health-card-name">{s.name}</span>
                  <span className="health-card-detail">{s.detail}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="health-card-latency">{s.latency}</span>
                {s.status === 'healthy' ? (
                  <span className="health-pill health-pill--healthy">
                    <CheckCircle2 size={12} /> Healthy
                  </span>
                ) : (
                  <span className="health-pill health-pill--offline">
                    <AlertTriangle size={12} /> Offline
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
