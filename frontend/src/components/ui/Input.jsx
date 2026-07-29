import './Input.css';

export function Input({
  label,
  id,
  error,
  hint,
  icon: Icon,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  return (
    <div className={`input-wrapper ${wrapperClassName}`}>
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className={`input-field ${Icon ? 'input-field--icon' : ''} ${error ? 'input-field--error' : ''}`}>
        {Icon && (
          <span className="input-icon" aria-hidden="true">
            <Icon size={15} />
          </span>
        )}
        <input id={id} className={`input ${className}`} {...rest} />
      </div>
      {error && <p className="input-error" role="alert">{error}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
    </div>
  );
}
