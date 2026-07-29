import './Badge.css';

const COLOR_MAP = {
  default: 'badge--default',
  brand:   'badge--brand',
  success: 'badge--success',
  warning: 'badge--warning',
  danger:  'badge--danger',
  info:    'badge--info',
  purple:  'badge--purple',
};

export function Badge({ children, color = 'default', dot = false, className = '' }) {
  return (
    <span className={`badge ${COLOR_MAP[color] || 'badge--default'} ${className}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Status badge with semantic color mapping */
export function StatusBadge({ status }) {
  const map = {
    active:   { color: 'success', label: 'Active' },
    inactive: { color: 'default', label: 'Inactive' },
    disabled: { color: 'warning', label: 'Disabled' },
    expired:  { color: 'danger',  label: 'Expired'  },
    revoked:  { color: 'danger',  label: 'Revoked'  },
    live:     { color: 'success', label: 'Live'      },
    test:     { color: 'info',    label: 'Test'      },
  };
  const cfg = map[status?.toLowerCase()] || { color: 'default', label: status };
  return <Badge color={cfg.color} dot>{cfg.label}</Badge>;
}
