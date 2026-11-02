import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Wallet, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DotGrid from '../components/DotGrid';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('Unable to connect to Expenzo backend server. Please verify the API server is running on port 8080.');
        } else if (err.response.status === 401) {
          setError(err.response.data?.message || 'Invalid email or password. Please check your credentials.');
        } else if (err.response.status === 503 || err.response.status === 502 || err.response.status === 504) {
          setError(err.response.data?.message || 'Expenzo API server (port 8080) is unreachable. Please verify the Java backend is running.');
        } else if (err.response.status === 500) {
          setError(err.response.data?.message || 'Server error occurred during login. Please check database connectivity.');
        } else {
          setError(err.response.data?.message || 'Login failed. Please check your credentials.');
        }
      } else {
        setError('An unexpected error occurred during login. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-foundation-bg flex flex-col items-center justify-center p-4 sm:p-6 text-gray-200 overflow-hidden">
      {/* React Bits Dot Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <DotGrid
          dotSize={3}
          gap={24}
          baseColor="#263445"
          activeColor="#14b8a6"
          proximity={120}
          opacity={0.35}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm bg-foundation-surface border border-foundation-border rounded-xl p-6 sm:p-8 shadow-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-lg bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-tealLight mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sign In to Expenzo</h2>
          <p className="text-xs text-gray-400 mt-1">Personal expense and budget management</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center pt-5 border-t border-foundation-border">
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-tealLight font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Public Legal Notice Footer */}
      <div className="relative z-10 mt-6 flex items-center gap-4 text-[11px] text-gray-500">
        <Link to="/terms" className="hover:text-gray-300 transition-colors">
          Terms of Service
        </Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-gray-300 transition-colors">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
