'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  FileText,
  FolderOpen,
  Globe,
  HelpCircle,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  PhoneCall,
  Scale,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sun,
  User,
  X,
  Zap,
} from 'lucide-react';
import CommandPalette from '../command-palette';
import EmergencyHelpline from '../emergency-helpline';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentLang, setCurrentLang] = useState('English');

  useEffect(() => {
    try {
      const uStr = localStorage.getItem('legalsathi_user');
      if (uStr) setUser(JSON.parse(uStr));
    } catch {}
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navGroups = [
    {
      group: 'Core Platform',
      items: [
        { label: 'Home', href: '/', icon: <Home size={17} /> },
        { label: 'AI Legal Chat', href: '/chat', icon: <MessageSquare size={17} /> },
        { label: 'Case Navigator', href: '/navigator', icon: <Sparkles size={17} /> },
        { label: 'Document Studio', href: '/documents', icon: <FileText size={17} /> },
        { label: 'My Cases & Vault', href: '/dashboard', icon: <FolderOpen size={17} /> },
      ],
    },
    {
      group: 'Legal Tools',
      items: [
        { label: 'Saved Results', href: '/dashboard', icon: <Star size={17} /> },
        { label: 'Legal Resources', href: '/documents', icon: <BookOpen size={17} /> },
        { label: 'Complaint Generator', href: '/documents', icon: <FileCheck size={17} /> },
        { label: 'Legal Templates', href: '/documents', icon: <FileText size={17} /> },
        { label: 'Rights Awareness', href: '/#rights', icon: <Scale size={17} /> },
        { label: 'Government Schemes', href: '/#schemes', icon: <Megaphone size={17} /> },
      ],
    },
    {
      group: 'System & Support',
      items: [
        { label: 'Settings', href: '/settings', icon: <Settings size={17} /> },
        { label: 'Help Center', href: '/profile', icon: <HelpCircle size={17} /> },
      ],
    },
  ];

  // Breadcrumbs title helper
  const getBreadcrumb = () => {
    if (pathname === '/') return 'Overview Dashboard';
    if (pathname.startsWith('/chat')) return 'AI Legal Chat Studio';
    if (pathname.startsWith('/navigator')) return 'Interactive Case Navigator';
    if (pathname.startsWith('/documents')) return 'Document Generator & Templates';
    if (pathname.startsWith('/dashboard')) return 'My Saved Cases & Repository';
    if (pathname.startsWith('/profile')) return 'User Profile & Settings';
    if (pathname.startsWith('/admin')) return 'Enterprise Admin Control Panel';
    return 'LegalSathi AI';
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'}`}>
      {/* Sidebar for Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r transition-all duration-300 z-30 sticky top-0 h-screen ${
          darkMode ? 'border-slate-800 bg-slate-900/95 backdrop-blur-md' : 'border-slate-200/80 bg-white'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <Shield size={18} />
              </span>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                LegalSathi <span className="text-blue-600">AI</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Shield size={18} />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Quick Search Shortcut */}
        <div className="p-3">
          <button
            onClick={() => setCmdOpen(true)}
            className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              darkMode
                ? 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                : 'border-slate-200/80 bg-slate-50 text-slate-500 hover:border-blue-300 hover:bg-white hover:text-blue-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              {!collapsed && <span>Search laws & tools</span>}
            </div>
            {!collapsed && <kbd className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">⌘K</kbd>}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : darkMode
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Upgrade Banner Card */}
        {!collapsed && (
          <div className="mx-3 my-2 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/80 p-3.5 dark:border-blue-900/50 dark:from-slate-800 dark:to-slate-850">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
              <Zap size={14} className="fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
              <span>Pro Plan Active</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Unlimited RAG queries, instant legal drafting & priority response.
            </p>
          </div>
        )}

        {/* Sidebar Footer User Profile */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl p-2 text-xs font-semibold border transition ${
                darkMode
                  ? 'border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              {!collapsed && <span>{darkMode ? 'Light' : 'Dark'}</span>}
            </button>
            <button
              onClick={() => setCurrentLang(currentLang === 'English' ? 'Hindi' : currentLang === 'Hindi' ? 'Marathi' : 'English')}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-2.5 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Change Language"
            >
              <Globe size={13} />
              {!collapsed && <span>{currentLang}</span>}
            </button>
          </div>

          {!collapsed && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2.5 border border-slate-100 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase shadow-xs">
                {user?.first_name?.[0] || 'G'}
              </div>
              <div className="overflow-hidden text-left flex-1">
                {user ? (
                  <>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <Link href="/profile" className="text-[10px] text-blue-600 hover:underline block truncate font-semibold">
                      Profile Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Guest Session</p>
                    <Link href="/login" className="text-[10px] text-blue-600 hover:underline block truncate font-semibold">
                      Sign In / Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg">
              <Menu size={20} />
            </button>
            {/* Breadcrumb Title */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{getBreadcrumb()}</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">LegalSathi AI · Enterprise Legal Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search Bar Trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-300 hover:bg-white hover:text-blue-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400"
            >
              <Search size={14} />
              <span>Ask or search anything...</span>
              <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono dark:bg-slate-800">⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <button className="relative rounded-xl border border-slate-200/80 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* User Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  <User size={14} />
                  <span className="hidden sm:inline">{user.first_name}</span>
                </Link>
                <button
                  onClick={async () => {
                    const refreshToken = localStorage.getItem('legalsathi_refresh_token');
                    if (refreshToken) {
                      try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/logout`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ refresh_token: refreshToken }),
                        });
                      } catch {}
                    }
                    localStorage.removeItem('legalsathi_token');
                    localStorage.removeItem('legalsathi_refresh_token');
                    localStorage.removeItem('legalsathi_user');
                    router.push('/login');
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950 dark:text-red-400"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 dark:text-slate-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Page Children Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      {/* Emergency Helplines Widget */}
      <EmergencyHelpline />
    </div>
  );
}
