import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../common/Toast';
import { FiMail, FiLock, FiKey } from 'react-icons/fi';


export default function Forgot() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast('Please enter your email', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast(res.data.message || 'OTP sent successfully', 'success');
        setStep(2);
      } else {
        toast(res.data.message || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast('Please enter the OTP code', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        toast(res.data.message || 'OTP verified successfully', 'success');
        setStep(3);
      } else {
        toast(res.data.message || 'Verification failed', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast('Password fields cannot be empty', 'warning');
      return;
    }
    if (password.length < 4) {
      toast('Password must be at least 4 characters', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      toast('Passwords do not match', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, password });
      if (res.data.success) {
        toast(res.data.message || 'Password reset successfully', 'success');
        navigate('/login');
      } else {
        toast(res.data.message || 'Reset failed', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-900 text-slate-100">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <span className="text-4xl">🔑</span>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white">Reset Password</h2>
          <p className="text-xs text-slate-400">
            {step === 1 && 'Enter your email to receive an OTP verification code'}
            {step === 2 && `We sent a 6-digit OTP code to ${email}`}
            {step === 3 && 'Create a new secure password for your account'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500"><FiMail /></span>
                <input
                  type="email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-white placeholder-slate-500"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-11 shadow-lg shadow-blue-500/10"
            >
              {loading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
              Send OTP Code
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">OTP Verification Code</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500"><FiKey /></span>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-white font-mono tracking-widest placeholder-slate-500 text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-11 shadow-lg shadow-blue-500/10"
            >
              {loading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
              Verify OTP
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setStep(1)} className="text-xs text-blue-400 hover:underline">Change email</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500"><FiLock /></span>
                <input
                  type="password"
                  placeholder="Min 4 characters"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-white placeholder-slate-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500"><FiLock /></span>
                <input
                  type="password"
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-white placeholder-slate-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-11 shadow-lg shadow-blue-500/10"
            >
              {loading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
              Update Password
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-700/30">
          <Link to="/login" className="text-xs text-slate-400 hover:text-white transition">Back to login</Link>
        </div>

      </div>
    </div>
  );
}
