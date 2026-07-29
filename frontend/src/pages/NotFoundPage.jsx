import { useNavigate } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './NotFoundPage.css';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="not-found">
      <div className="not-found__glow" aria-hidden="true" />
      <div className="not-found__icon" aria-hidden="true">
        <Zap size={32} />
      </div>
      <p className="not-found__code">404</p>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button variant="primary" icon={Home} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  );
}
