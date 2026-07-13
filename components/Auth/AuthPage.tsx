// components/Auth/AuthPage.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleButton from '@/lib/auth/GoogleButton';
import toast from 'react-hot-toast';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const dmSans   = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

interface LoginForm {
  email       : string;
  password    : string;
}

interface RegisterForm {
  full_name       : string;
  email           : string;
  phone           : string;
  password        : string;
  confirmPassword : string;
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function saveSession(token: string, user: any) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

// ════════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════════

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [mode,                setMode               ] = useState<'login' | 'register'>(initialMode);
  const [loading,             setLoading            ] = useState(false);
  const [googleLoading,       setGoogleLoading      ] = useState(false);
  const [showPassword,        setShowPassword       ] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe,          setRememberMe         ] = useState(false);
  const [acceptTerms,         setAcceptTerms        ] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email    : '',
    password : '',
  });

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    full_name       : '',
    email           : '',
    phone           : '',
    password        : '',
    confirmPassword : '',
  });

  // ── Redirect if already logged in ─────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push(searchParams.get('redirect') || '/');
    }
  }, [router, searchParams]);

  // ── Toggle mode ────────────────────────────────────────────────
  const toggleMode = useCallback(() => {
    const next = mode === 'login' ? 'register' : 'login';
    setMode(next);
    window.history.replaceState(null, '', `/${next}`);
  }, [mode]);

  // ── After success ──────────────────────────────────────────────
  function handleSuccess(data: any, message: string) {
    saveSession(data.token, data.user);
    toast.success(message);
    const redirect = searchParams.get('redirect') || data.redirectTo || '/';
    router.push(redirect);
  }

  // ════════════════════════════════════════════════════════════════
  //  LOGIN
  // ════════════════════════════════════════════════════════════════

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({
          email     : loginForm.email.trim().toLowerCase(),
          password  : loginForm.password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Login failed');
        return;
      }

      handleSuccess(data.data, 'Welcome back!');

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  //  REGISTER
  // ════════════════════════════════════════════════════════════════

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validation ───────────────────────────────────────────────
    if (!registerForm.full_name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      toast.error('Invalid email format');
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (!acceptTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({
          full_name : registerForm.full_name.trim(),
          email     : registerForm.email.trim().toLowerCase(),
          phone     : registerForm.phone.trim() || undefined,
          password  : registerForm.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Registration failed');
        return;
      }

      handleSuccess(data.data, 'Account created successfully!');

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  //  GOOGLE
  // ════════════════════════════════════════════════════════════════

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const res = await fetch('/api/v1/auth/google', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Google login failed');
        return;
      }

      handleSuccess(data.data, 'Welcome to Acasa!');

    } catch (err: any) {
      toast.error(err.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    toast.error('Google authentication failed. Please try again.');
    console.error('Google Error:', error);
  };

  // ════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <section className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 ${dmSans.className}`}>
      <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

          {/* ── Left Panel ─────────────────────────────────────── */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-gray-800 min-h-[600px]">
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative z-10">
              <h2 className={`${playfair.className} text-4xl text-white leading-tight mb-6`}>
                {mode === 'login'
                  ? 'Welcome back to your luxury journey'
                  : 'Begin your exclusive property quest'}
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                {mode === 'login'
                  ? 'Pick up where you left off. Your saved properties and recommendations await.'
                  : "Join Dubai's most discerning platform. Access exclusive listings before they hit the market."}
              </p>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                {[
                  ['1,923+', 'Properties'],
                  ['30+',    'Developers'],
                  ['$1.2B',  'Portfolio' ],
                ].map(([value, label]) => (
                  <div key={label} className="text-center">
                    <p className={`${playfair.className} text-2xl text-white`}>{value}</p>
                    <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Panel ────────────────────────────────────── */}
          <div className="flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md">

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className={`${playfair.className} text-3xl text-gray-900`}>
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  {mode === 'login' ? 'Sign in to your account' : 'Get started with Acasa'}
                </p>
              </div>

              {/* Tab toggle */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-6">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => m !== mode && toggleMode()}
                    className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                      mode === m
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {/* ── LOGIN FORM ──────────────────────────────────── */}
              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-600">
                      Keep me signed in
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      : 'Sign In'
                    }
                  </button>
                </form>

              ) : (
              /* ── REGISTER FORM ───────────────────────────────── */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">

                  {/* Full name */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={registerForm.full_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="+971 50..."
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password + Confirm */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="6+ chars"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Confirm</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I accept the{' '}
                      <Link href="/terms" className="text-gray-900 hover:underline">Terms</Link>
                      {' '}& {' '}
                      <Link href="/privacy" className="text-gray-900 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      : 'Create Account'
                    }
                  </button>
                </form>
              )}

              {/* ── Divider ─────────────────────────────────────── */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* ── Google Button ────────────────────────────────── */}
              {googleLoading ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                </div>
              ) : (
                <GoogleButton
                  mode={mode}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              )}

              {/* ── Toggle mode link ─────────────────────────────── */}
              <p className="mt-6 text-center text-sm text-gray-500">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-1 font-semibold text-gray-900 hover:underline"
                >
                  {mode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </p>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}