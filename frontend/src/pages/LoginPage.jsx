import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import './LoginPage.css';

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    const result = await login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      {/* Left — Branding panel */}
      <div className="login-panel login-panel--brand">
        <div className="login-brand">
          <div className="login-brand__icon">
            <Zap size={28} />
          </div>
          <h1 className="login-brand__name">RateShield</h1>
          <p className="login-brand__tagline">
            Production-grade API Protection &amp; Rate Limiting Platform
          </p>
        </div>
        <div className="login-features">
          {['Dynamic Rate Limiting', 'Multi-Algorithm Support', 'Real-time Telemetry', 'JWT Admin Auth'].map((f) => (
            <div key={f} className="login-feature">
              <span className="login-feature__dot" aria-hidden="true" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="login-panel login-panel--form">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="login-form-logo" aria-hidden="true">
              <Zap size={18} />
            </div>
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-subtitle">Enter your admin credentials to continue</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={15} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <Input
              id="login-email"
              type="email"
              label="Email address"
              placeholder="admin@rateshield.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              error={fieldErrors.email}
              autoComplete="email"
              autoFocus
            />

            <div className="login-password-wrap">
              <Input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={fieldErrors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-show-pass"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
