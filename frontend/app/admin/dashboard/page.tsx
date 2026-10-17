'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  FolderOpen,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Users,
  UserX,
  Zap,
} from 'lucide-react';

export type AdminUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  preferred_language: string;
  country: string;
  state: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'settings'>('analytics');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Settings State
  const [settingsData, setSettingsData] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('legalsathi_admin_token');
    if (!t) {
      router.push('/admin/login');
      return;
    }
    setToken(t);
    fetchData(t);
  }, [router]);

  const fetchData = async (authToken: string) => {
    setLoading(true);
    try {
      const authHeaders = { Authorization: `Bearer ${authToken}` };
      const [resStats, resUsers, resSettings] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/stats`, { headers: authHeaders }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/users`, { headers: authHeaders }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/settings`, { headers: authHeaders }),
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resSettings.ok) setSettingsData(await resSettings.json());
    } catch {}
    setLoading(false);
  };

  const handleUserAction = async (userId: number, action: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/users/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: userId, action }),
        }
      );

      if (res.ok) {
        fetchData(token);
      }
    } catch {}
  };

  const handleSaveSetting = async (key: string, value: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/settings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key, value }),
        }
      );
      if (res.ok) {
        setSaveStatus(`Saved: ${key}`);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch {}
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.first_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.last_name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Administrator Operations Portal</h1>
            <p className="text-xs text-slate-400">LegalSathi AI System Control & Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => token && fetchData(token)}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            title="Refresh System Data"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('legalsathi_admin_token');
              router.push('/admin/login');
            }}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/40"
          >
            <LogOut size={14} /> Exit Portal
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'analytics', label: 'System Analytics', icon: <Activity size={16} /> },
          { id: 'users', label: `User Management (${users.length})`, icon: <Users size={16} /> },
          { id: 'settings', label: 'Platform Settings', icon: <Settings size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {saveStatus && (
        <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-400">
          ✓ {saveStatus}
        </div>
      )}

      {/* TAB 1: SYSTEM ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-slate-400">Total Registered Users</p>
              <p className="text-3xl font-extrabold text-blue-400">{stats.total_users}</p>
              <p className="text-[10px] text-slate-500">{stats.verified_users} Verified Accounts</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-slate-400">Total Conversations</p>
              <p className="text-3xl font-extrabold text-emerald-400">{stats.chats_today}</p>
              <p className="text-[10px] text-slate-500">Domain breakdown in analytics below</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-slate-400">Generated Documents</p>
              <p className="text-3xl font-extrabold text-indigo-400">{stats.generated_documents}</p>
              <p className="text-[10px] text-slate-500">FIR, Notices & RTI Complaints</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-slate-400">Active Saved Cases</p>
              <p className="text-3xl font-extrabold text-amber-400">{stats.saved_cases}</p>
              <p className="text-[10px] text-slate-500">Storage Used: {stats.storage_used}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health & API Usage</h3>
              <p className="text-sm font-bold text-emerald-400">{stats.api_usage}</p>
              <p className="text-xs text-slate-400">Most active legal domains: {stats.most_used_category}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Database & Security</h3>
              <p className="text-sm font-bold text-blue-400">SQLite / PostgreSQL Connected</p>
              <p className="text-xs text-slate-400">Encryption: Passlib Bcrypt & JWT HS256 active</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name/email..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono">{u.id}</td>
                    <td className="p-3 font-bold text-white">{u.first_name} {u.last_name}</td>
                    <td className="p-3 font-mono text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.is_verified ? <span className="text-emerald-400">✓ Yes</span> : <span className="text-amber-400">Pending</span>}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {u.is_active ? (
                        <button
                          onClick={() => handleUserAction(u.id, 'suspend')}
                          className="px-2 py-1 bg-amber-900/40 text-amber-300 hover:bg-amber-900/80 rounded-lg text-[10px] font-bold"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(u.id, 'activate')}
                          className="px-2 py-1 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/80 rounded-lg text-[10px] font-bold"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(u.id, 'delete')}
                        className="px-2 py-1 bg-red-900/40 text-red-400 hover:bg-red-900/80 rounded-lg text-[10px] font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white">System Maintenance & Configurations</h3>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Maintenance Mode</label>
              <select
                value={settingsData.maintenance_mode || 'false'}
                onChange={(e) => {
                  setSettingsData({ ...settingsData, maintenance_mode: e.target.value });
                  handleSaveSetting('maintenance_mode', e.target.value);
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-100 outline-none"
              >
                <option value="false">Disabled (Normal Operations)</option>
                <option value="true">Enabled (Maintenance Lock)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">SMTP Host</label>
              <input
                type="text"
                value={settingsData.smtp_host || 'smtp.gmail.com'}
                onChange={(e) => setSettingsData({ ...settingsData, smtp_host: e.target.value })}
                onBlur={(e) => handleSaveSetting('smtp_host', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
