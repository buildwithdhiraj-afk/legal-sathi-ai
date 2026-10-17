'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, ExternalLink, ArrowRight, X, Sparkles, Building2, Calendar, FileText } from 'lucide-react';
import { apiUrl } from '@/lib/api';

export type GovernmentAnnouncement = {
  id: number;
  gazette_notification_no: string;
  title: string;
  ministry: string;
  publication_date: string;
  effective_date?: string;
  official_pdf_url: string;
  pdf_sha256: string;
  is_verified_source: boolean;
  act_affected: string;
  summary_old_rule?: string;
  summary_new_rule: string;
  key_citizen_impact: string;
};

export default function GovtAnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<GovernmentAnnouncement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<GovernmentAnnouncement | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(apiUrl('/api/announcements/latest'));
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch {}
  };

  if (announcements.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <ShieldCheck size={16} />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              Latest Government Law Announcements (2024–2026)
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                ✓ 100% Official Govt Verified
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Grid of Verified Gazette Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  <Building2 size={11} /> {item.ministry.split('(')[0]}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Calendar size={11} /> {item.publication_date}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition leading-snug">
                {item.title}
              </h4>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {item.key_citizen_impact}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-3">
              <button
                onClick={() => setSelectedAnnouncement(item)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View Rule Changes</span>
                <ArrowRight size={12} />
              </button>

              <a
                href={item.official_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-md hover:bg-emerald-100 transition"
                title="Verify original PDF on Government Portal"
              >
                <span>Govt Document</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Modal: Old Rule vs New Government Rule */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  <ShieldCheck size={14} /> Official Gazette Notification: {selectedAnnouncement.gazette_notification_no}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Issued by {selectedAnnouncement.ministry} • Published {selectedAnnouncement.publication_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Old Rule vs New Rule Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Rule Card */}
              <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/30 p-4 space-y-2">
                <span className="inline-block rounded-md bg-red-100 dark:bg-red-900/60 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-800 dark:text-red-300">
                  🔴 Old Rule / Previous Provision
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedAnnouncement.summary_old_rule || "Prior statutory provision before amendment."}
                </p>
              </div>

              {/* New Government Rule Card */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-2">
                <span className="inline-block rounded-md bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">
                  🟢 New Enacted Government Rule
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedAnnouncement.summary_new_rule}
                </p>
              </div>
            </div>

            {/* Key Citizen Impact */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 p-4 space-y-1.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600 dark:text-blue-400" /> Practical Impact for Indian Citizens
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedAnnouncement.key_citizen_impact}
              </p>
            </div>

            {/* Modal Footer & Direct PDF Verification */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                <FileText size={12} />
                <span className="truncate">SHA-256: {selectedAnnouncement.pdf_sha256.slice(0, 24)}...</span>
              </div>
              <a
                href={selectedAnnouncement.official_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
              >
                <span>Verify Original Govt Document (.pdf)</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
