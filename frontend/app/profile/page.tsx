'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  Shield,
  Sun,
  Trash2,
  User,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    preferred_language: 'en',
    theme: 'light',
    country: 'India',
    state: 'Delhi',
  });

  const [pwdData, setPwdData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('legalsathi_token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    fetchProfile(t);
  }, [router]);

  const fetchProfile = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/me`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.ok) {
        const u = await res.json();
        setUser(u);
        setFormData({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          phone: u.phone || '',
          preferred_language: u.preferred_language || 'en',
          theme: u.theme || 'light',
          country: u.country || 'India',
          state: u.state || 'Delhi',
        });
      }
    } catch {}
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setMsg('');
    setErrMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/profile/update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      setMsg('Profile updated successfully!');
      setUser(data.user);
      localStorage.setItem('legalsathi_user', JSON.stringify(data.user));
    } catch (err) {
      setErrMsg((err as Error).message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setMsg('');
    setErrMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/profile/change-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(pwdData),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Password change failed');
      setMsg('Password updated successfully!');
      setPwdData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setErrMsg((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 sm:py-10 space-y-8 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <User size={14} /> Account & Profile Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            User Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Manage personal details, security credentials, and preferred languages.</p>
        </div>
        <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          ← Back to Vault
        </Link>
      </div>

      {msg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">✓ {msg}</div>}
      {errMsg && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">⚠️ {errMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white uppercase shadow-md shadow-blue-600/30">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span className="inline-block mt-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">
                {user?.role || 'Verified User'}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Phone:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user?.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">State:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user?.state || 'Delhi'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Language:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{user?.preferred_language || 'en'}</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            <button type="submit" className="rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition">
              Save Profile Changes
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Change Password</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="password"
                placeholder="Current Password"
                value={pwdData.old_password}
                onChange={(e) => setPwdData({ ...pwdData, old_password: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-white"
              />
              <input
                type="password"
                placeholder="New Password"
                value={pwdData.new_password}
                onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-white"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={pwdData.confirm_password}
                onChange={(e) => setPwdData({ ...pwdData, confirm_password: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-white"
              />
            </div>
            <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900 transition">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
