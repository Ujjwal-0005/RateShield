import './Skeleton.css';

/** Shimmer skeleton block. Height defaults to 16px. */
export function Skeleton({ width, height = 16, className = '', style = {} }) {
  return (
    <span
      className={`skeleton-block ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/** Pre-composed stat card skeleton */
export function StatCardSkeleton() {
  return (
    <div className="stat-card-skeleton">
      <Skeleton width={36} height={36} className="skeleton-block--circle" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="40%" height={22} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="table-row-skeleton">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <Skeleton width={`${50 + Math.random() * 40}%`} height={13} />
        </td>
      ))}
    </tr>
  );
}
