'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Scale, Shield, User } from 'lucide-react';
import { apiUrl } from '@/lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const reg = searchParams.get('registered');
    const em = searchParams.get('email');
    if (em) setEmail(em);
    if (reg === 'true') {
      setSuccessMsg('Account created successfully! Please sign in with your credentials below.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      // Save token and user info
      localStorage.setItem('legalsathi_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('legalsathi_refresh_token', data.refresh_token);
      }
      localStorage.setItem('legalsathi_user', JSON.stringify(data.user));

      if (data.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Login Form */}
        <div className="p-6 sm:p-10 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <Scale size={18} />
              </span>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                LegalSathi <span className="text-blue-600">AI</span>
              </span>
            </Link>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sign in to your LegalSathi AI account to access saved cases & drafts.</p>
            </div>
          </div>

          {successMsg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800 dark:border-red-900/50 dark:bg-red-950 dark:text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:text-white dark:focus:bg-slate-900"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 pr-10 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:text-white dark:focus:bg-slate-900"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Sign In to Account</span>}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account yet?{' '}
              <Link href="/register" className="font-bold text-blue-600 hover:underline">
                Create Free Account
              </Link>
            </p>
            <Link href="/chat" className="inline-block text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              Continue as Guest (5 free queries) ➔
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Graphic Card */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-white">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-400/30">
              <Shield size={14} /> Enterprise Security
            </div>
            <h3 className="text-2xl font-black leading-tight">
              AI-Powered Indian Legal Guidance Platform
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Understand Indian statutory provisions, auto-generate legal notice drafts, track case evidence, and receive clear legal explanations.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Verified citations mapping to official government portals</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Multilingual support in English, Hindi, and Marathi</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>End-to-end encrypted storage for private case files</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md text-[11px] text-slate-300">
            "LegalSathi AI helps users navigate complex Indian laws in plain language with 100% explainable citations."
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
