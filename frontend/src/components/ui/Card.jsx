import './Card.css';

export function Card({ children, className = '', padding = 'md', hover = false, ...rest }) {
  return (
    <div
      className={`card card--pad-${padding} ${hover ? 'card--hover' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header__text">
        {title && <h3 className="card-header__title">{title}</h3>}
        {description && <p className="card-header__desc">{description}</p>}
      </div>
      {action && <div className="card-header__action">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}
