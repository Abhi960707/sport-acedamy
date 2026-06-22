import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setLogin(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const tempErrors = {};
    if (!login.email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(login.email)) {
      tempErrors.email = 'Invalid email address format';
    }
    if (!login.password) {
      tempErrors.password = 'Password is required';
    } else if (login.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogin(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast('Please correct the validation errors', 'warning');
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
        if (rememberMe) {
          localStorage.setItem('savedEmail', login.email);
        } else {
          localStorage.removeItem('savedEmail');
        }
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
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-300/20 rounded-full filter blur-3xl animate-pulse pointer-events-none" />

      {/* Main glass card container */}
      <div className="relative z-10 w-full max-w-4xl bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-12 max-h-[600px]">
        
        {/* Left Branding Side Panel */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex-col justify-between relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          
          <div className="space-y-2">
            <span className="text-4xl filter drop-shadow-md">🏆</span>
            <h1 className="text-2xl font-display font-extrabold tracking-tight">Sport Academy</h1>
            <p className="text-xs text-blue-100 uppercase tracking-widest font-semibold">Management System</p>
          </div>

          <ul className="space-y-4 text-sm text-blue-100 font-medium">
            <li className="flex items-center gap-3">
              <span className="text-teal-300 font-bold">⚡</span> Manage Games &amp; Events
            </li>
            <li className="flex items-center gap-3">
              <span className="text-teal-300 font-bold">👤</span> Track Academy Coaches
            </li>
            <li className="flex items-center gap-3">
              <span className="text-teal-300 font-bold">🏃</span> Monitor Player Enrollments
            </li>
            <li className="flex items-center gap-3">
              <span className="text-teal-300 font-bold">📊</span> Review Detailed Reports
            </li>
          </ul>

          <div className="text-xs text-blue-200">
            &copy; 2026 Sport Academy Inc.
          </div>
        </div>

        {/* Right Form Card */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-gray-800 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-gray-500 font-medium">Sign in to manage your academy account</p>
          </div>

          <form onSubmit={handleLogin} id="login-form" className="space-y-4" noValidate>
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="login-email">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 text-base"><FiMail /></span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={login.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-[11px] font-semibold text-red-500">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="login-password">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 text-base"><FiLock /></span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={login.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] font-semibold text-red-500">{errors.password}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 font-medium">Remember email</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-55 cursor-pointer"
            >
              {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 pt-2 font-medium">
              Don't have an account?{' '}
              <Link className="text-blue-600 hover:underline font-bold" to="/signup">Create account</Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;
