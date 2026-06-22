import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [signupInfo, setSignupInfo] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!signupInfo.name) {
      tempErrors.name = 'Full name is required';
    } else if (signupInfo.name.trim().length < 3) {
      tempErrors.name = 'Name must be at least 3 characters';
    }

    if (!signupInfo.email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(signupInfo.email)) {
      tempErrors.email = 'Invalid email address format';
    }

    if (!signupInfo.password) {
      tempErrors.password = 'Password is required';
    } else if (signupInfo.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast('Please correct the validation errors', 'warning');
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
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-teal-50 to-indigo-100 overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-300/20 rounded-full filter blur-3xl animate-pulse pointer-events-none" />

      {/* Main glass card container */}
      <div className="relative z-10 w-full max-w-4xl bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-12 max-h-[600px]">
        
        {/* Left Branding Side Panel */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-teal-600 to-indigo-700 p-8 text-white flex-col justify-between relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          
          <div className="space-y-2">
            <span className="text-4xl filter drop-shadow-md">🥇</span>
            <h1 className="text-2xl font-display font-extrabold tracking-tight">Join the Academy</h1>
            <p className="text-xs text-teal-100 uppercase tracking-widest font-semibold">Create your account</p>
          </div>

          <ul className="space-y-4 text-sm text-teal-100 font-medium">
            <li className="flex items-center gap-3">
              <span className="text-emerald-300 font-bold">✓</span> Free to Sign Up
            </li>
            <li className="flex items-center gap-3">
              <span className="text-emerald-300 font-bold">✓</span> Secure &amp; Private JWT Auth
            </li>
            <li className="flex items-center gap-3">
              <span className="text-emerald-300 font-bold">✓</span> Real-time Fee Tracking
            </li>
            <li className="flex items-center gap-3">
              <span className="text-emerald-300 font-bold">✓</span> Instant Search &amp; Sorting
            </li>
          </ul>

          <div className="text-xs text-teal-200">
            &copy; 2026 Sport Academy Inc.
          </div>
        </div>

        {/* Right Form Card */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-gray-800 tracking-tight">Create Account</h2>
            <p className="text-xs text-gray-500 font-medium">Sign up to get started as an administrator</p>
          </div>

          <form onSubmit={handleSignup} id="signup-form" className="space-y-4" noValidate>
            
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="signup-name">Full Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 text-base"><FiUser /></span>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={signupInfo.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                    errors.name ? 'border-red-400' : 'border-gray-200'
                  }`}
                  autoFocus
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-[11px] font-semibold text-red-500">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="signup-email">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 text-base"><FiMail /></span>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={signupInfo.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-[11px] font-semibold text-red-500">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="signup-password">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 text-base"><FiLock /></span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={signupInfo.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                  autoComplete="new-password"
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

            {/* Submit Button */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all disabled:opacity-55 cursor-pointer"
            >
              {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 pt-2 font-medium">
              Already have an account?{' '}
              <Link className="text-teal-600 hover:underline font-bold" to="/login">Sign in</Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Signup;
