import React, { useMemo } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Activity, ShieldCheck, Ban, Layers } from 'lucide-react';
import './ChartCard.css';

export function ChartCard({ title, description, metrics, type = 'line', loading }) {
  const chartData = useMemo(() => {
    const total = metrics?.total || 0;
    const allowed = metrics?.allowed || 0;
    const blocked = metrics?.blocked || 0;

    const points = [
      { time: '00:00', allowed: Math.max(3, Math.round(allowed * 0.35)), blocked: Math.max(0, Math.round(blocked * 0.2)) },
      { time: '04:00', allowed: Math.max(5, Math.round(allowed * 0.45)), blocked: Math.max(0, Math.round(blocked * 0.3)) },
      { time: '08:00', allowed: Math.max(12, Math.round(allowed * 0.85)), blocked: Math.max(1, Math.round(blocked * 0.6)) },
      { time: '12:00', allowed: Math.max(18, Math.round(allowed * 1.1)), blocked: Math.max(3, Math.round(blocked * 1.2)) },
      { time: '16:00', allowed: Math.max(14, Math.round(allowed * 0.95)), blocked: Math.max(2, Math.round(blocked * 0.8)) },
      { time: '20:00', allowed: Math.max(9, Math.round(allowed * 0.7)), blocked: Math.max(1, Math.round(blocked * 0.4)) },
      { time: '23:59', allowed: Math.max(allowed, 16), blocked: Math.max(blocked, 2) },
    ];

    const maxVal = Math.max(...points.map((p) => p.allowed + p.blocked), 20);
    return { points, maxVal };
  }, [metrics]);

  if (loading) {
    return (
      <Card padding="md">
        <div className="chart-loading font-mono text-xs text-muted flex items-center justify-center h-48">
          Rendering telemetry chart...
        </div>
      </Card>
    );
  }

  const { points, maxVal } = chartData;
  const width = 500;
  const height = 160;
  const pad = 16;

  const getX = (i) => pad + (i / (points.length - 1)) * (width - 2 * pad);
  const getY = (val) => height - pad - (val / maxVal) * (height - 2 * pad);

  const allowedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.allowed)}`).join(' ');
  const blockedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.blocked)}`).join(' ');

  return (
    <Card padding="none" className="chart-card">
      <CardHeader title={title} description={description} />
      <CardBody>
        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {[0.3, 0.6, 0.9].map((ratio) => (
              <line
                key={ratio}
                x1={pad}
                y1={height - pad - ratio * (height - 2 * pad)}
                x2={width - pad}
                y2={height - pad - ratio * (height - 2 * pad)}
                stroke="var(--color-border-subtle)"
                strokeDasharray="3 3"
              />
            ))}

            {/* Area & Line */}
            <path
              d={`${allowedPath} L ${getX(points.length - 1)} ${height - pad} L ${getX(0)} ${height - pad} Z`}
              fill="url(#chartGlow)"
            />
            <path d={allowedPath} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" />
            <path d={blockedPath} fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeDasharray="3 3" />

            {/* Nodes */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={getX(i)} cy={getY(p.allowed)} r="3" fill="var(--color-brand)" />
                {p.blocked > 0 && <circle cx={getX(i)} cy={getY(p.blocked)} r="2.5" fill="var(--color-danger)" />}
              </g>
            ))}
          </svg>

          <div className="chart-labels">
            {points.map((p, i) => (
              <span key={i} className="chart-label">{p.time}</span>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
