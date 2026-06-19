import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import '../Style/Login.css';

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogin(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = login;

    if (!email) {
      toast('Email is required', 'warning');
      return;
    }
    if (!password) {
      toast('Password is required', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4005/login/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });

      const result = await response.json();
      const { success, token, message } = result;

      if (success) {
        localStorage.setItem('token', token);
        toast('Welcome back! Login successful', 'success');
        setTimeout(() => navigate('/home'), 800);
      } else {
        toast(message || 'Wrong email or password', 'error');
      }
    } catch (error) {
      toast('Server not responding. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
        <div className="auth-bg__orb auth-bg__orb--3" />
      </div>

      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-panel auth-panel--left">
          <div className="auth-panel__content">
            <div className="auth-panel__trophy">🏆</div>
            <h1 className="auth-panel__title">Sport Academy</h1>
            <p className="auth-panel__sub">Management System</p>
            <ul className="auth-panel__features">
              <li>⚡ Manage Games &amp; Events</li>
              <li>👤 Track Coaches</li>
              <li>🏃 Monitor Player Progress</li>
              <li>📊 Detailed Reports</li>
            </ul>
          </div>
        </div>

        {/* Login form */}
        <div className="auth-card">
          <div className="auth-card__header">
            <h2 className="auth-card__title">Welcome Back</h2>
            <p className="auth-card__subtitle">Sign in to your account</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin} id="login-form" noValidate>
            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="login-email">Email Address</label>
              <div className="auth-form__input-wrap">
                <span className="auth-form__input-icon">✉</span>
                <input
                  id="login-email"
                  className="auth-form__input"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={login.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="login-password">Password</label>
              <div className="auth-form__input-wrap">
                <span className="auth-form__input-icon">🔒</span>
                <input
                  id="login-password"
                  className="auth-form__input"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={login.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              className="auth-btn"
              type="submit"
              disabled={loading}
            >
              {loading && <span className="loading-spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="auth-form__footer">
              Don't have an account?{' '}
              <Link className="auth-form__link" to="/signup">Create account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
