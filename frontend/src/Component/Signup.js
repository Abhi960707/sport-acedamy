import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import '../Style/Signup.css';

function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [signupInfo, setSignupInfo] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password } = signupInfo;

    // BUG FIX: added return so code doesn't fall into try/catch
    if (!name || !email || !password) {
      toast('Name, email and password are required', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4005/login/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupInfo),
      });

      const result = await response.json();
      const { success, error } = result;

      if (success) {
        toast('Account created successfully! Please sign in.', 'success');
        // BUG FIX: was '/Login' (uppercase) — route is '/login'
        setTimeout(() => navigate('/login'), 900);
      } else if (error) {
        toast(typeof error === 'string' ? error : 'Signup failed. Please try again.', 'error');
      } else {
        toast('Server error. Please try again later.', 'error');
      }
    } catch (err) {
      toast('Server not responding. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
        <div className="auth-bg__orb auth-bg__orb--3" />
      </div>

      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-panel auth-panel--left">
          <div className="auth-panel__content">
            <div className="auth-panel__trophy">🥇</div>
            <h1 className="auth-panel__title">Join the Academy</h1>
            <p className="auth-panel__sub">Create your account</p>
            <ul className="auth-panel__features">
              <li>✅ Free to Sign Up</li>
              <li>🔐 Secure &amp; Private</li>
              <li>📱 Access Anywhere</li>
              <li>🚀 Get Started Instantly</li>
            </ul>
          </div>
        </div>

        {/* Signup form */}
        <div className="auth-card">
          <div className="auth-card__header">
            <h2 className="auth-card__title">Create Account</h2>
            <p className="auth-card__subtitle">Fill in the details below to get started</p>
          </div>

          <form className="auth-form" onSubmit={handleSignup} id="signup-form" noValidate>
            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="signup-name">Full Name</label>
              <div className="auth-form__input-wrap">
                <span className="auth-form__input-icon">👤</span>
                <input
                  id="signup-name"
                  className="auth-form__input"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={signupInfo.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="signup-email">Email Address</label>
              <div className="auth-form__input-wrap">
                <span className="auth-form__input-icon">✉</span>
                <input
                  id="signup-email"
                  className="auth-form__input"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={signupInfo.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="signup-password">Password</label>
              <div className="auth-form__input-wrap">
                <span className="auth-form__input-icon">🔒</span>
                <input
                  id="signup-password"
                  className="auth-form__input"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={signupInfo.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              id="signup-submit-btn"
              className="auth-btn auth-btn--teal"
              type="submit"
              disabled={loading}
            >
              {loading && <span className="loading-spinner" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="auth-form__footer">
              Already have an account?{' '}
              <Link className="auth-form__link" to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
