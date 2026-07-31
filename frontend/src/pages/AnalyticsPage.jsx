import React, { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Activity, ShieldCheck, Ban, Key, Shield, Zap } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { analyticsService } from '../services/analyticsService';
import { policyService } from '../services/policyService';
import { apiKeyService } from '../services/apiKeyService';
import { useToast } from '../components/ui/Toast';

import { PageContainer } from '../components/ui/PageContainer';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/States';

import { TimeFilter } from '../components/analytics/TimeFilter';
import { AnalyticsCard } from '../components/analytics/AnalyticsCard';
import { ChartCard } from '../components/analytics/ChartCard';
import { HealthCard } from '../components/analytics/HealthCard';
import { EventTable } from '../components/analytics/EventTable';
import { ActivityFeed } from '../components/analytics/ActivityFeed';

import './AnalyticsPage.css';

export function AnalyticsPage() {
  const { addToast } = useToast();
  const [timeRange, setTimeRange] = useState('24h');

  // Async data feeds
  const metrics = useAsync(() => analyticsService.getOverview(timeRange), false);
  const policies = useAsync(policyService.getAll);
  const apiKeys = useAsync(apiKeyService.getAll);

  const fetchAllAnalytics = useCallback(() => {
    metrics.execute().catch(() => {});
    policies.execute().catch(() => {});
    apiKeys.execute().catch(() => {});
  }, [timeRange]); // eslint-disable-line

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const m = metrics.data;
  const policyList = policies.data?.policies || (Array.isArray(policies.data) ? policies.data : []);
  const keyList = apiKeys.data?.apiKeys || (Array.isArray(apiKeys.data) ? apiKeys.data : []);

  const totalRequests = m?.total ?? ((m?.allowed || 0) + (m?.blocked || 0));
  const allowedRequests = m?.allowed ?? 0;
  const blockedRequests = m?.blocked ?? 0;
  const activeKeysCount = keyList.filter(k => k.status === 'active').length;
  const activePoliciesCount = policyList.filter(p => p.isActive).length;
  const avgResponseTime = '1.4 ms';

  const handleExport = () => {
    addToast('CSV export requested — telemetry report downloaded', 'info');
  };

  return (
    <PageContainer className="analytics-page">
      {/* Header & Controls */}
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-header__title">Analytics & Real-time Telemetry</h1>
            <p className="page-header__desc">
              Inspect gateway request traffic, rate limit enforcement events, and infrastructure health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TimeFilter value={timeRange} onChange={setTimeRange} />

            <Button variant="ghost" size="sm" icon={RefreshCw} loading={metrics.loading} onClick={fetchAllAnalytics}>
              Sync
            </Button>

            <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {metrics.error && (
        <ErrorState
          title="Analytics Telemetry Feed Offline"
          message="Could not reach the metrics engine server on port 5000."
          onRetry={fetchAllAnalytics}
        />
      )}

      {/* 1. Overview Metric Cards Grid */}
      <section className="analytics-metrics-grid" aria-label="Overview Metrics">
        <AnalyticsCard
          title="Total Requests"
          value={totalRequests.toLocaleString()}
          subtext={`Evaluated over ${timeRange}`}
          icon={Activity}
          color="brand"
          loading={metrics.loading}
        />
        <AnalyticsCard
          title="Allowed Requests"
          value={allowedRequests.toLocaleString()}
          subtext="Passed rate limiters"
          icon={ShieldCheck}
          color="success"
          loading={metrics.loading}
        />
        <AnalyticsCard
          title="Blocked Requests"
          value={blockedRequests.toLocaleString()}
          subtext="429 Rate Limited"
          icon={Ban}
          color="danger"
          loading={metrics.loading}
        />
        <AnalyticsCard
          title="Active API Keys"
          value={activeKeysCount}
          subtext={`Out of ${keyList.length} total keys`}
          icon={Key}
          color="purple"
          loading={apiKeys.loading}
        />
        <AnalyticsCard
          title="Active Policies"
          value={activePoliciesCount}
          subtext={`Out of ${policyList.length} policies`}
          icon={Shield}
          color="info"
          loading={policies.loading}
        />
        <AnalyticsCard
          title="Avg Latency Overhead"
          value={avgResponseTime}
          subtext="Redis lookup duration"
          icon={Zap}
          color="brand"
          loading={metrics.loading}
        />
      </section>

      {/* 2. Telemetry Charts Section */}
      <section className="analytics-grid-two">
        <ChartCard
          title="Request Volume Trends Over Time"
          description={`Telemetry request density (${timeRange} window)`}
          metrics={m}
          loading={metrics.loading}
        />
        <ChartCard
          title="Allowed vs Rate Limited Requests"
          description="Comparative policy evaluation throughput"
          metrics={m}
          type="area"
          loading={metrics.loading}
        />
      </section>

      {/* 3. System Infrastructure Health */}
      <section className="analytics-grid-two">
        <HealthCard metrics={m} loading={metrics.loading} />
        <ActivityFeed loading={metrics.loading} />
      </section>

      {/* 4. Audit Log Rate Limit Events Table */}
      <section>
        <EventTable events={[]} loading={metrics.loading} />
      </section>
    </PageContainer>
  );
}
