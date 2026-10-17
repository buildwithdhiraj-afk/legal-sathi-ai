'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2, Eye, EyeOff, Globe, Loader2, Lock, Mail, Phone, Scale, Shield, User } from 'lucide-react';
import { apiUrl } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    preferred_language: 'en',
    country: 'India',
    state: 'Delhi',
    agree_terms: false,
    agree_privacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password strength rules
  const pwd = formData.password;
  const hasMinLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.agree_terms || !formData.agree_privacy) {
      setErrorMsg('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setErrorMsg('Password must contain at least one letter and one number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      if (data.access_token) {
        localStorage.setItem('legalsathi_token', data.access_token);
        localStorage.setItem('legalsathi_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        router.push(`/login?email=${encodeURIComponent(formData.email)}&registered=true`);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl grid grid-cols-1 md:grid-cols-12">
        {/* Left Visual Banner */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-white">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <Scale size={18} />
              </span>
              <span className="font-extrabold text-xl tracking-tight text-white">
                LegalSathi <span className="text-blue-400">AI</span>
              </span>
            </Link>

            <div className="space-y-2">
              <h3 className="text-2xl font-black leading-tight">Create Your Free Account</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join thousands of Indian citizens accessing instant legal guidance, RAG statutory citations, and document generation.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>100% Free Account & Legal Vault</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Multilingual Support (Hi / Mr / En)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Automated FIR & Notice Drafting</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md text-[11px] text-slate-300">
            🔒 Strictly Private & Encrypted. Your legal inquiries are never shared.
          </div>
        </div>

        {/* Right Registration Form */}
        <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Register Free</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fill in your details to create your legal intelligence workspace.</p>
          </div>

          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800 dark:border-red-900/50 dark:bg-red-950 dark:text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Rahul"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Sharma"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
            </div>

            {/* Password Strength Visual Checklist */}
            {formData.password.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850 space-y-1 text-[11px]">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-1 font-medium">
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                    {hasMinLength ? '✓' : '○'} At least 8 characters
                  </span>
                  <span className={hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                    {hasUpper ? '✓' : '○'} One uppercase (A-Z)
                  </span>
                  <span className={hasLower ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                    {hasLower ? '✓' : '○'} One lowercase (a-z)
                  </span>
                  <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                    {hasNumber ? '✓' : '○'} One number (0-9)
                  </span>
                  <span className={hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                    {hasSpecial ? '✓' : '○'} One symbol (!@#$%)
                  </span>
                </div>
              </div>
            )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            {/* Checkbox agreements */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agree_terms}
                  onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>I agree to the Terms of Service & Legal Disclaimer</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agree_privacy}
                  onChange={(e) => setFormData({ ...formData, agree_privacy: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>I agree to the Privacy Policy & Security Standard</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Create Account</span>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
