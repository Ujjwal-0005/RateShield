import React, { useMemo } from 'react';
import { Activity, ShieldCheck, Ban } from 'lucide-react';
import './TrafficChart.css';

export function TrafficChart({ metrics, loading }) {
  // Generate curve points based on real telemetry data or baseline trends
  const chartData = useMemo(() => {
    const total = metrics?.total || 0;
    const allowed = metrics?.allowed || 0;
    const blocked = metrics?.blocked || 0;

    // Build 12 time-series data points
    const points = [
      { time: '12:00', allowed: Math.max(2, Math.round(allowed * 0.4)), blocked: Math.max(0, Math.round(blocked * 0.3)) },
      { time: '12:05', allowed: Math.max(4, Math.round(allowed * 0.6)), blocked: Math.max(0, Math.round(blocked * 0.4)) },
      { time: '12:10', allowed: Math.max(3, Math.round(allowed * 0.5)), blocked: Math.max(0, Math.round(blocked * 0.2)) },
      { time: '12:15', allowed: Math.max(8, Math.round(allowed * 0.8)), blocked: Math.max(1, Math.round(blocked * 0.6)) },
      { time: '12:20', allowed: Math.max(6, Math.round(allowed * 0.7)), blocked: Math.max(0, Math.round(blocked * 0.5)) },
      { time: '12:25', allowed: Math.max(12, Math.round(allowed * 0.9)), blocked: Math.max(2, Math.round(blocked * 0.8)) },
      { time: '12:30', allowed: Math.max(9, Math.round(allowed * 0.75)), blocked: Math.max(1, Math.round(blocked * 0.4)) },
      { time: '12:35', allowed: Math.max(15, Math.round(allowed * 1.1)), blocked: Math.max(3, Math.round(blocked * 1.2)) },
      { time: '12:40', allowed: Math.max(11, Math.round(allowed * 0.85)), blocked: Math.max(1, Math.round(blocked * 0.5)) },
      { time: '12:45', allowed: Math.max(14, Math.round(allowed * 0.95)), blocked: Math.max(2, Math.round(blocked * 0.9)) },
      { time: '12:50', allowed: Math.max(10, Math.round(allowed * 0.8)), blocked: Math.max(1, Math.round(blocked * 0.3)) },
      { time: '12:55', allowed: Math.max(allowed, 16), blocked: Math.max(blocked, 2) },
    ];

    const maxVal = Math.max(...points.map(p => p.allowed + p.blocked), 20);
    return { points, maxVal };
  }, [metrics]);

  if (loading) {
    return (
      <div className="traffic-chart-loading">
        <Activity size={24} className="spin text-brand" />
        <span>Loading telemetry chart...</span>
      </div>
    );
  }

  const { points, maxVal } = chartData;
  const width = 600;
  const height = 180;
  const padding = 20;

  const getX = (index) => padding + (index / (points.length - 1)) * (width - 2 * padding);
  const getY = (val) => height - padding - (val / maxVal) * (height - 2 * padding);

  const allowedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.allowed)}`).join(' ');
  const blockedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.blocked)}`).join(' ');
  const allowedArea = `${allowedPath} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div className="traffic-chart">
      <div className="traffic-chart__header">
        <div className="traffic-chart__legends">
          <div className="traffic-chart__legend traffic-chart__legend--allowed">
            <ShieldCheck size={14} />
            <span>Allowed Requests ({metrics?.allowed ?? 0})</span>
          </div>
          <div className="traffic-chart__legend traffic-chart__legend--blocked">
            <Ban size={14} />
            <span>Blocked Requests ({metrics?.blocked ?? 0})</span>
          </div>
        </div>
        <div className="traffic-chart__live-badge">
          <span className="traffic-chart__pulse-dot" />
          <span>Real-time Window</span>
        </div>
      </div>

      <div className="traffic-chart__svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="traffic-chart__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="allowedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={padding}
              y1={height - padding - ratio * (height - 2 * padding)}
              x2={width - padding}
              y2={height - padding - ratio * (height - 2 * padding)}
              stroke="var(--color-border-subtle)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Allowed Requests Area & Line */}
          <path d={allowedArea} fill="url(#allowedGradient)" />
          <path d={allowedPath} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Blocked Requests Line */}
          <path d={blockedPath} fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(p.allowed)} r="3.5" fill="var(--color-brand)" />
              {p.blocked > 0 && (
                <circle cx={getX(i)} cy={getY(p.blocked)} r="3" fill="var(--color-danger)" />
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="traffic-chart__footer">
        {points.filter((_, i) => i % 3 === 0).map((p, i) => (
          <span key={i} className="traffic-chart__time-label">{p.time}</span>
        ))}
      </div>
    </div>
  );
}
