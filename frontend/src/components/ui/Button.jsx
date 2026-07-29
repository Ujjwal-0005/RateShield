import './Button.css';

/**
 * Button component
 * Props: variant ('primary'|'secondary'|'ghost'|'danger'), size ('sm'|'md'|'lg'),
 *        loading, disabled, icon (left icon), iconRight, ...rest (native button props)
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...rest
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {!loading && Icon && <Icon size={16} className="btn__icon" aria-hidden="true" />}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight size={16} className="btn__icon btn__icon--right" aria-hidden="true" />}
    </button>
  );
}
