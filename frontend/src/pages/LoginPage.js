import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, setStoredUser } from '../services/api';

export default function LoginPage() {
  const demoLoginLock = useRef(false);
  const [demoLoginBusy, setDemoLoginBusy] = useState(false);

  const navigate = useNavigate();
  const demoEmail = process.env.REACT_APP_DEMO_EMAIL || '';
  const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || '';
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, demoLoginCredentials) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login((demoLoginCredentials?.email ?? email), (demoLoginCredentials?.password ?? password));
      setToken(token);
      setStoredUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (event) => {
    if (demoLoginLock.current) return;
    event.preventDefault();
    if (!demoEmail || !demoPassword) {
      setError('Demo credentials are unavailable.');
      return;
    }
    demoLoginLock.current = true;
    setDemoLoginBusy(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      await handleSubmit(event, { email: demoEmail, password: demoPassword });
    } finally {
      demoLoginLock.current = false;
      setDemoLoginBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-brand">OT/ICS SECOPS</h1>
        <p className="login-sub">AIOTSecOpsForICS — Industrial Security Ops Hub</p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading || demoLoginBusy || !demoEmail || !demoPassword}
          aria-label="Log In as Demo"
          style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
        >
          {demoLoginBusy ? 'Logging In…' : 'Log In as Demo'}
        </button>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? <><span className="spinner" />Authenticating...</> : 'Sign In'}
        </button>

        <p className="login-hint">
          Demo account: <code>{demoEmail || 'not configured'}</code>. Use Log In as Demo.
        </p>
      </form>
    </div>
  );
}
