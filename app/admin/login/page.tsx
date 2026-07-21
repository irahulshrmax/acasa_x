'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
} from 'lucide-react';

export default function AdminLogin() {
  const router  = useRouter();
  const checked = useRef(false);

  const [email,        setEmail       ] = useState('');
  const [password,     setPassword    ] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading     ] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error,        setError       ] = useState<string | null>(null);
  const [success,      setSuccess     ] = useState(false);
  const [rememberMe,   setRememberMe  ] = useState(false);
  const [touched,      setTouched     ] = useState({
    email   : false,
    password: false,
  });

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/session/validate', {
          method     : 'GET',
          credentials: 'include',
          cache      : 'no-store',
          headers    : { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) {
          setAuthChecking(false);
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data.success) {
          toast.success('Already logged in! Redirecting...', { duration: 2000 });
          router.replace('/admin/dashboard');
        } else {
          setAuthChecking(false);
          setLoading(false);
        }
      } catch {
        setAuthChecking(false);
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const isFormValid = () =>
    validateEmail(email) && password.length >= 6;

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setError(null);
    if (field === 'email')    setEmail(value);
    if (field === 'password') setPassword(value);
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setTouched({ email: true, password: true });
      toast.error('Please fix all validation errors');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/v1/session/login', {
        method     : 'POST',
        headers    : { 'Content-Type': 'application/json' },
        credentials: 'include',
        body       : JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (data.success && data.data?.isAdmin) {
        setSuccess(true);
        toast.success('Login successful! Redirecting...');
        setTimeout(() => router.replace('/admin/dashboard'), 1000);

      } else if (data.success && !data.data?.isAdmin) {
        const msg = 'Admin access required. Please use admin credentials.';
        setError(msg);
        toast.error(msg);
        setLoading(false);

      } else {
        const msg = data.message || 'Invalid email or password';
        setError(msg);
        toast.error(msg);
        setLoading(false);
      }
    } catch {
      const msg = 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-neutral-400 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center justify-center w-14 h-14 bg-neutral-900 rounded-2xl mb-4"
          >
            <Shield size={24} className="text-white" />
          </motion.div>
          <h1 className="text-xl font-semibold text-neutral-900">Admin Login</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Enter your credentials to access the dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">

          {/* Success Alert */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
              >
                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-emerald-700">Login successful! Redirecting...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="admin@acasa.ae"
                  disabled={loading}
                  autoComplete="email"
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all duration-200
                    focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
                    ${touched.email && !validateEmail(email)
                      ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                      : touched.email && validateEmail(email)
                      ? 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400'
                      : 'border-neutral-200 focus:ring-neutral-100 focus:border-neutral-400'
                    }
                  `}
                />
              </div>
              {touched.email && !validateEmail(email) && (
                <p className="mt-1.5 text-xs text-red-500">Please enter a valid email</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-xl text-sm transition-all duration-200
                    focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
                    ${touched.password && password.length > 0 && password.length < 6
                      ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                      : touched.password && password.length >= 6
                      ? 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400'
                      : 'border-neutral-200 focus:ring-neutral-100 focus:border-neutral-400'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && password.length > 0 && password.length < 6 && (
                <p className="mt-1.5 text-xs text-red-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-600">Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`
                w-full py-3 rounded-xl text-sm font-medium text-white transition-all duration-200
                flex items-center justify-center gap-2
                ${loading || !isFormValid()
                  ? 'bg-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-neutral-800'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {success ? 'Redirecting...' : 'Signing in...'}
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-400">
              {new Date().getFullYear()} Acasa. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}