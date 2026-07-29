import { AlertTriangle, RefreshCcw, PackageOpen } from 'lucide-react';
import { Button } from './Button';
import './States.css';

/** Error state with optional retry action */
export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-container" role="alert">
      <span className="state-icon state-icon--danger">
        <AlertTriangle size={24} />
      </span>
      <h3 className="state-title">{title}</h3>
      {message && <p className="state-desc">{message}</p>}
      {onRetry && (
        <Button variant="secondary" icon={RefreshCcw} onClick={onRetry} size="sm">
          Try again
        </Button>
      )}
    </div>
  );
}

/** Empty state with optional CTA */
export function EmptyState({ title, description, action }) {
  return (
    <div className="state-container">
      <span className="state-icon state-icon--default">
        <PackageOpen size={24} />
      </span>
      <h3 className="state-title">{title}</h3>
      {description && <p className="state-desc">{description}</p>}
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}

/** Full-page loading spinner */
export function PageLoader() {
  return (
    <div className="page-loader" aria-label="Loading" role="status">
      <div className="page-loader__ring">
        <div /><div /><div /><div />
      </div>
    </div>
  );
}

/** Inline spinner for small contexts */
export function Spinner({ size = 16, color }) {
  return (
    <svg
      className="spinner-inline spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: color || 'currentColor' }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" opacity="0.2" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
    </svg>
  );
}
