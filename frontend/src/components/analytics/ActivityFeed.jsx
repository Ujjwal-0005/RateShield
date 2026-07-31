import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Key, Shield, User, Clock } from 'lucide-react';
import './ActivityFeed.css';

export function ActivityFeed({ activities = [], loading }) {
  const sampleActivities = [
    {
      id: 1,
      type: 'key_created',
      title: 'New API Key Provisioned',
      desc: 'Stripe Webhook Relay Key generated for Live environment',
      time: '12 mins ago',
      icon: Key,
      color: 'purple',
    },
    {
      id: 2,
      type: 'policy_created',
      title: 'Policy Updated',
      desc: 'Tier 1 Sliding Window limit increased to 250 req/60s',
      time: '45 mins ago',
      icon: Shield,
      color: 'brand',
    },
    {
      id: 3,
      type: 'admin_login',
      title: 'Administrator Session Rehydrated',
      desc: 'Admin logged in from trusted IP 127.0.0.1',
      time: '2 hours ago',
      icon: User,
      color: 'success',
    },
  ];

  const items = activities.length > 0 ? activities : sampleActivities;

  return (
    <Card padding="none" className="activity-feed-card">
      <CardHeader title="Recent Administrative Audit Feed" description="Platform operational activity log" />
      <CardBody>
        <div className="activity-feed-list">
          {items.map((item) => (
            <div key={item.id} className="activity-feed-item">
              <div className={`activity-feed-icon activity-feed-icon--${item.color}`}>
                <item.icon size={15} />
              </div>
              <div className="activity-feed-body">
                <div className="flex items-center justify-between">
                  <span className="activity-feed-title">{item.title}</span>
                  <span className="activity-feed-time flex items-center gap-1">
                    <Clock size={11} /> {item.time}
                  </span>
                </div>
                <p className="activity-feed-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
