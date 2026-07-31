import { User, Lock, Bell, Sliders } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

function Section({ icon: Icon, title, description, children }) {
  return (
    <Card padding="none" className="settings-section">
      <CardHeader
        title={
          <span className="settings-section__title-row">
            <Icon size={16} aria-hidden="true" />
            {title}
          </span>
        }
        description={description}
      />
      <div className="settings-section__body">{children}</div>
    </Card>
  );
}

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__desc">Manage your admin profile and account preferences</p>
      </div>

      <div className="settings-grid">
        <Section icon={User} title="Profile" description="Your admin account information">
          <div className="settings-field-list">
            <div className="settings-field">
              <span className="settings-field__label">Name</span>
              <span className="settings-field__value">{user?.name || '—'}</span>
            </div>
            <div className="settings-field">
              <span className="settings-field__label">Email</span>
              <span className="settings-field__value">{user?.email || '—'}</span>
            </div>
            <div className="settings-field">
              <span className="settings-field__label">Role</span>
              <span className="settings-field__value" style={{ textTransform: 'capitalize' }}>{user?.role || '—'}</span>
            </div>
            <div className="settings-field">
              <span className="settings-field__label">Last login</span>
              <span className="settings-field__value">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
              </span>
            </div>
          </div>
          <div className="settings-coming-soon">
            <Sliders size={14} aria-hidden="true" />
            Profile editing coming in a future milestone
          </div>
        </Section>

        <Section icon={Lock} title="Security" description="Password and session management">
          <div className="settings-coming-soon">
            <Sliders size={14} aria-hidden="true" />
            Password change and session controls coming in a future milestone
          </div>
        </Section>

        <Section icon={Bell} title="Notifications" description="Alert and notification preferences">
          <div className="settings-coming-soon">
            <Sliders size={14} aria-hidden="true" />
            Notification settings coming in a future milestone
          </div>
        </Section>
      </div>
    </div>
  );
}
