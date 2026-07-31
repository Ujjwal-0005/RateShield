import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Key, Activity, Ban, Database, Server,
  Plus, Play, BarChart2, ShieldCheck, CheckCircle2,
  AlertTriangle, RefreshCw, Cpu, ExternalLink, Clock, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { metricsService } from '../services/metricsService';
import { policyService } from '../services/policyService';
import { apiKeyService } from '../services/apiKeyService';

import { PageContainer } from '../components/ui/PageContainer';
import { DashboardCard } from '../components/ui/DashboardCard';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import { ErrorState, EmptyState } from '../components/ui/States';
import { TrafficChart } from '../components/ui/TrafficChart';

import { CreatePolicyModal } from '../components/modals/CreatePolicyModal';
import { CreateKeyModal } from '../components/modals/CreateKeyModal';
import { ApiPlaygroundModal } from '../components/modals/ApiPlaygroundModal';

import './DashboardPage.css';

/* ─── Reusable Stat Card Component ───────────────────────────── */
function StatCard({ label, value, icon: Icon, color = 'brand', subtext, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon-wrap">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value ?? '0'}</p>
        {subtext && <p className="stat-card__subtext">{subtext}</p>}
      </div>
    </div>
  );
}

/* ─── Health Badge Helper Component ────────────────────────── */
function HealthBadge({ status, latency }) {
  if (status === 'healthy' || status === 'operational') {
    return (
      <div className="health-status health-status--healthy">
        <CheckCircle2 size={13} />
        <span>Healthy</span>
        {latency && <span className="health-status__latency">{latency}</span>}
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="health-status health-status--warning">
        <AlertTriangle size={13} />
        <span>Degraded</span>
      </div>
    );
  }
  return (
    <div className="health-status health-status--offline">
      <AlertTriangle size={13} />
      <span>Offline</span>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isPlaygroundModalOpen, setIsPlaygroundModalOpen] = useState(false);

  // Data fetching
  const metrics = useAsync(metricsService.getMetrics);
  const policies = useAsync(policyService.getAll);
  const apiKeys = useAsync(apiKeyService.getAll);

  const fetchAllData = useCallback(() => {
    metrics.execute().catch(() => {});
    policies.execute().catch(() => {});
    apiKeys.execute().catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculated Stats
  const m = metrics.data;
  const policyList = policies.data?.policies || (Array.isArray(policies.data) ? policies.data : []);
  const keyList = apiKeys.data?.apiKeys || (Array.isArray(apiKeys.data) ? apiKeys.data : []);

  const totalPolicies = policyList.length;
  const totalKeys = keyList.length;
  const activeKeys = keyList.filter(k => k.status === 'active').length;
  const allowedRequests = m?.allowed ?? 0;
  const blockedRequests = m?.blocked ?? 0;
  const todayTotalRequests = m?.total ?? (allowedRequests + blockedRequests);

  const isLoading = metrics.loading || policies.loading || apiKeys.loading;
  const isError = metrics.error && policies.error && apiKeys.error;

  return (
    <PageContainer className="dashboard-overview">
      {/* 1. Welcome Header */}
      <header className="welcome-header">
        <div className="welcome-header__info">
          <div className="welcome-header__badge-row">
            <span className="welcome-header__env-badge">
              <span className="welcome-header__env-dot" />
              Environment: {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
            </span>
            <span className="welcome-header__project">RateShield Engine v1.0</span>
          </div>
          <h1 className="welcome-header__title">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="welcome-header__subtitle">
            RateShield API Gateway Control Center — Real-time Distributed Protection
          </p>
        </div>

        <div className="welcome-header__actions">
          <Button variant="secondary" size="sm" icon={Play} onClick={() => setIsPlaygroundModalOpen(true)}>
            API Playground
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsKeyModalOpen(true)}>
            Create API Key
          </Button>
        </div>
      </header>

      {/* 2. System Health Status Bar */}
      <section className="health-bar-section" aria-label="System Health">
        <div className="health-bar">
          <div className="health-bar__item">
            <div className="health-bar__item-header">
              <Database size={15} className="text-brand" />
              <span className="health-bar__label">Redis Cluster</span>
            </div>
            <HealthBadge status={!metrics.error ? 'healthy' : 'offline'} latency="1.2ms" />
          </div>

          <div className="health-bar__divider" />

          <div className="health-bar__item">
            <div className="health-bar__item-header">
              <Layers size={15} className="text-purple" />
              <span className="health-bar__label">MongoDB Primary</span>
            </div>
            <HealthBadge status={!policies.error ? 'healthy' : 'offline'} latency="4.8ms" />
          </div>

          <div className="health-bar__divider" />

          <div className="health-bar__item">
            <div className="health-bar__item-header">
              <Server size={15} className="text-success" />
              <span className="health-bar__label">Express API Node</span>
            </div>
            <HealthBadge status={!metrics.error ? 'healthy' : 'offline'} latency="8ms" />
          </div>

          <div className="health-bar__divider" />

          <div className="health-bar__item">
            <div className="health-bar__item-header">
              <Cpu size={15} className="text-info" />
              <span className="health-bar__label">Gateway Proxy</span>
            </div>
            <HealthBadge status="healthy" latency="0.6ms" />
          </div>
        </div>
      </section>

      {/* Error state alert if APIs fail */}
      {isError && (
        <ErrorState
          title="Telemetry Feed Disconnected"
          message="Unable to communicate with the RateShield backend API service on port 5000."
          onRetry={fetchAllData}
        />
      )}

      {/* 3. Statistics Cards Grid */}
      <section className="stats-grid" aria-label="Key Statistics">
        <StatCard
          label="Total Policies"
          value={totalPolicies}
          icon={Shield}
          color="brand"
          subtext="Configured rulesets"
          loading={isLoading}
        />
        <StatCard
          label="Total API Keys"
          value={totalKeys}
          icon={Key}
          color="purple"
          subtext={`${activeKeys} currently active`}
          loading={isLoading}
        />
        <StatCard
          label="Active Keys"
          value={activeKeys}
          icon={ShieldCheck}
          color="success"
          subtext="Provisioned keys"
          loading={isLoading}
        />
        <StatCard
          label="Allowed Requests"
          value={allowedRequests.toLocaleString()}
          icon={Activity}
          color="info"
          subtext="Passed limiter"
          loading={isLoading}
        />
        <StatCard
          label="Blocked Requests"
          value={blockedRequests.toLocaleString()}
          icon={Ban}
          color="danger"
          subtext="429 Rate Limited"
          loading={isLoading}
        />
        <StatCard
          label="Today's Traffic"
          value={todayTotalRequests.toLocaleString()}
          icon={RefreshCw}
          color="brand"
          subtext="Total requests processed"
          loading={isLoading}
        />
      </section>

      {/* 4. Traffic Overview Chart Section */}
      <section className="dashboard-grid-main">
        <DashboardCard
          title="Live Traffic & Rate Limiting Telemetry"
          description="Real-time window request metrics (Allowed vs Blocked Rate Limits)"
          action={
            <Button variant="ghost" size="sm" icon={RefreshCw} loading={isLoading} onClick={fetchAllData}>
              Sync Feed
            </Button>
          }
          className="traffic-card"
        >
          <TrafficChart metrics={m} loading={metrics.loading} />
        </DashboardCard>

        {/* 6. Quick Actions Grid Card */}
        <DashboardCard
          title="Quick Actions"
          description="Administrative control shortcuts"
          className="quick-actions-card"
        >
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => setIsKeyModalOpen(true)}>
              <div className="quick-action-btn__icon bg-purple-muted text-purple">
                <Key size={18} />
              </div>
              <div className="quick-action-btn__text">
                <span className="quick-action-btn__title">Create API Key</span>
                <span className="quick-action-btn__desc">Generate new API key for client</span>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => setIsPolicyModalOpen(true)}>
              <div className="quick-action-btn__icon bg-brand-muted text-brand">
                <Shield size={18} />
              </div>
              <div className="quick-action-btn__text">
                <span className="quick-action-btn__title">Create Policy</span>
                <span className="quick-action-btn__desc">Define algorithm and capacity limits</span>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => setIsPlaygroundModalOpen(true)}>
              <div className="quick-action-btn__icon bg-success-muted text-success">
                <Play size={18} />
              </div>
              <div className="quick-action-btn__text">
                <span className="quick-action-btn__title">API Playground</span>
                <span className="quick-action-btn__desc">Test rate limiter response live</span>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => navigate('/policies')}>
              <div className="quick-action-btn__icon bg-info-muted text-info">
                <BarChart2 size={18} />
              </div>
              <div className="quick-action-btn__text">
                <span className="quick-action-btn__title">Manage Policies</span>
                <span className="quick-action-btn__desc">View all algorithm rulesets</span>
              </div>
            </button>
          </div>
        </DashboardCard>
      </section>

      {/* 5. Recent Activity Section */}
      <section className="activity-section">
        <div className="activity-grid">
          {/* Recent API Keys Card */}
          <DashboardCard
            title="Recent API Keys"
            description="Latest keys generated"
            action={
              <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => navigate('/api-keys')}>
                View All
              </Button>
            }
          >
            {keyList.length === 0 ? (
              <EmptyState
                title="No API Keys Provisioned"
                description="Click below to generate your first client key."
                action={
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsKeyModalOpen(true)}>
                    Create Key
                  </Button>
                }
              />
            ) : (
              <div className="activity-table-wrap">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Key Identifier</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyList.slice(0, 4).map((k) => (
                      <tr key={k._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Key size={13} className="text-muted" />
                            <span className="font-medium text-primary text-xs">{k.name}</span>
                          </div>
                        </td>
                        <td>
                          <Badge color={k.keyType === 'live' ? 'success' : 'info'}>{k.keyType}</Badge>
                        </td>
                        <td><StatusBadge status={k.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>

          {/* Recent Policies Card */}
          <DashboardCard
            title="Active Policies"
            description="Configured engine policies"
            action={
              <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => navigate('/policies')}>
                View All
              </Button>
            }
          >
            {policyList.length === 0 ? (
              <EmptyState
                title="No Rate Policies Found"
                description="Create a policy to attach to client keys."
                action={
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsPolicyModalOpen(true)}>
                    Create Policy
                  </Button>
                }
              />
            ) : (
              <div className="activity-table-wrap">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Policy Name</th>
                      <th>Algorithm</th>
                      <th>Rate Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyList.slice(0, 4).map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Shield size={13} className="text-brand" />
                            <span className="font-medium text-primary text-xs">{p.name}</span>
                          </div>
                        </td>
                        <td>
                          <Badge color={p.algorithm === 'sliding' ? 'brand' : 'purple'}>
                            {p.algorithm}
                          </Badge>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-secondary">
                            {p.maxRequests} req / {p.windowSize}s
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>
        </div>
      </section>

      {/* Render Action Modals */}
      <CreatePolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onSuccess={fetchAllData}
      />
      <CreateKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSuccess={fetchAllData}
      />
      <ApiPlaygroundModal
        isOpen={isPlaygroundModalOpen}
        onClose={() => setIsPlaygroundModalOpen(false)}
      />
    </PageContainer>
  );
}
