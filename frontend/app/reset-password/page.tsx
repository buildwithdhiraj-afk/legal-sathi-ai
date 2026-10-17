'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, Shield, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword, confirm_password: confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Password reset failed');

      setStatusMsg('Password updated successfully! You can now log in.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Shield size={18} />
            </span>
            <span className="font-bold text-xl text-slate-900">LegalSathi AI</span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900">Create New Password</h2>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            ⚠️ {errorMsg}
          </div>
        )}

        {statusMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
            <p className="text-xs font-bold text-emerald-800">{statusMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                />
                <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
