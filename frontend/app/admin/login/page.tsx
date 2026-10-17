'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert } from 'lucide-react';
import { apiUrl } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();

  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: adminEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Admin authentication failed');

      localStorage.setItem('legalsathi_admin_token', data.access_token);
      localStorage.setItem('legalsathi_user', JSON.stringify(data.user));

      router.push('/admin/dashboard');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10 shadow-2xl text-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">LegalSathi AI Administrator</h2>
          <p className="text-xs text-slate-400">Restricted Portal Access · Authorized Personnel Only</p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-bold text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@legalsathi.ai"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 pl-9 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
              />
              <Mail size={16} className="absolute left-3 top-2.5 text-slate-600" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 pl-9 pr-10 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
              />
              <Lock size={16} className="absolute left-3 top-2.5 text-slate-600" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Authenticate Administrator
          </button>
        </form>
      </div>
    </div>
  );
}
