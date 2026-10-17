'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  Globe,
  HelpCircle,
  History,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';
import { apiUrl } from '@/lib/api';
import type { CaseAnalysis, SavedCase } from './types';

export default function NavigatorPage() {
  const searchParams = useSearchParams();
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [query, setQuery] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [savedStatusMsg, setSavedStatusMsg] = useState('');
  const [analyzeError, setAnalyzeError] = useState('');
  const [draftError, setDraftError] = useState('');

  // Draft document state
  const [draftContent, setDraftContent] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSavedCases();
    const qParam = searchParams.get('q');
    if (qParam && !query) {
      setQuery(qParam);
      handleAnalyze(qParam);
    }
  }, [searchParams]);

  const fetchSavedCases = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('legalsathi_token') : null;
      const res = await fetch(apiUrl('/api/navigator/cases'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCases(data);
      }
    } catch {}
  };

  const handleAnalyze = async (overrideQuery?: string, customAnswers?: Record<string, string>, targetStep: number = 2) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;

    // Instant non-blocking step transition (<10ms)
    setAnalyzeError('');
    setWizardStep(targetStep);
    setLoading(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('legalsathi_token') : null;

    try {
      const res = await fetch(apiUrl('/api/navigator/analyze'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: q,
          answers: customAnswers || answers,
          case_code: analysis?.case_id,
        }),
      });

      if (res.ok) {
        const data: CaseAnalysis = await res.json();
        setAnalysis(data);
        setLoading(false);
        return;
      }

      const errData = await res.json().catch(() => ({}));
      setAnalyzeError(errData.detail || `Analysis failed (HTTP ${res.status}). Please try again.`);
    } catch {
      setAnalyzeError('Could not reach the LegalSathi analysis service. Please try again.');
    }

    setWizardStep(1);
    setLoading(false);
  };

  const handleSaveCase = async () => {
    if (!analysis) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('legalsathi_token') : null;
      const res = await fetch(apiUrl('/api/navigator/cases/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          case_code: analysis.case_id,
          title: analysis.case_summary.slice(0, 80),
          category: analysis.legal_category,
          urgency: analysis.urgency_level,
          progress: analysis.progress_percentage,
          data_json: analysis,
        }),
      });

      if (res.ok) {
        setSavedStatusMsg('Case saved successfully!');
        fetchSavedCases();
        setTimeout(() => setSavedStatusMsg(''), 3000);
      } else if (res.status === 401) {
        setSavedStatusMsg('Please log in to save cases.');
        setTimeout(() => setSavedStatusMsg(''), 3000);
      }
    } catch {}
  };

  const handleToggleEvidence = (id: string, nextStatus: 'pending' | 'uploaded' | 'verified', fileDetails?: { name: string; size: number }) => {
    if (!analysis) return;
    const nowStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const updatedEv = analysis.evidence_checklist.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          status: nextStatus,
          fileName: fileDetails ? fileDetails.name : e.fileName,
          fileSize: fileDetails ? `${(fileDetails.size / 1024).toFixed(1)} KB` : e.fileSize,
          uploadedAt: fileDetails ? nowStr : (e.uploadedAt || nowStr),
        };
      }
      return e;
    });
    
    // Recalculate progress percentage
    const total = updatedEv.length;
    const completedCount = updatedEv.filter((e) => e.status !== 'pending').length;
    const newProgress = Math.min(100, Math.max(20, Math.round((completedCount / (total || 1)) * 60 + 30)));

    setAnalysis({
      ...analysis,
      evidence_checklist: updatedEv,
      progress_percentage: newProgress,
    });
  };

  const handleFileUpload = (file: File, targetItemId?: string) => {
    if (!analysis) return;
    let targetId = targetItemId;

    if (!targetId) {
      const pendingItem = analysis.evidence_checklist.find((e) => e.status === 'pending');
      if (pendingItem) {
        targetId = pendingItem.id;
      } else {
        targetId = analysis.evidence_checklist[0]?.id;
      }
    }

    if (targetId) {
      handleToggleEvidence(targetId, 'uploaded', { name: file.name, size: file.size });
      const itemObj = analysis.evidence_checklist.find((e) => e.id === targetId);
      alert(`✓ Document Received!\nFile "${file.name}" uploaded for: ${itemObj?.item || 'Evidence Item'}.\nStatus automatically updated to Uploaded.`);
    }
  };

  const handleUploadRequiredDoc = (docIndex: number, file: File) => {
    if (!analysis) return;
    const nowStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const updatedDocs = analysis.required_documents.map((d, idx) => {
      if (idx === docIndex) {
        return {
          ...d,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: nowStr,
          status: 'uploaded' as const,
        };
      }
      return d;
    });

    setAnalysis({
      ...analysis,
      required_documents: updatedDocs,
    });
    alert(`✓ Document Received!\nAttached file "${file.name}" for: ${analysis.required_documents[docIndex].doc_name}.`);
  };

  const handleToggleTimeline = (id: string) => {
    if (!analysis) return;
    const updatedT = analysis.timeline_steps.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setAnalysis({ ...analysis, timeline_steps: updatedT });
  };

  const handleGenerateDraft = async (type: string) => {
    if (!analysis) return;
    setDraftError('');
    setLoadingDraft(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('legalsathi_token') : null;
    try {
      const res = await fetch(apiUrl('/api/navigator/draft'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          draft_type: type,
          case_summary: analysis.case_summary,
          details: { location: answers['q-1'] || 'India', date: new Date().toISOString().split('T')[0] },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDraftTitle(data.title);
        setDraftContent(data.content);
        setWizardStep(5);
      } else {
        const errData = await res.json().catch(() => ({}));
        setDraftError(errData.detail || `Draft generation failed (HTTP ${res.status}). Please try again.`);
      }
    } catch {
      setDraftError('Could not reach the LegalSathi draft service. Please try again.');
    }
    setLoadingDraft(false);
  };

  const handleCopyDraft = () => {
    try {
      if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(draftContent);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = draftContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Copying to clipboard is not supported in your browser.');
    }
  };

  const handleDownloadDraft = () => {
    const blob = new Blob([draftContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(draftTitle || 'Legal_Draft').replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <Scale size={18} />
              </span>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition">
                  LegalSathi AI
                </h1>
                <span className="text-[11px] font-semibold text-blue-600">Case Navigator & Roadmap</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <Link href="/chat" className="text-slate-600 hover:text-blue-600">Chat</Link>
            <Link href="/navigator" className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">Navigator</Link>
            <Link href="/documents" className="text-slate-600 hover:text-blue-600">Documents</Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-blue-600">Dashboard</Link>
          </nav>

          {analysis && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                <Sparkles size={13} /> {analysis.case_id}
              </span>
              <button
                onClick={handleSaveCase}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Save size={14} /> Save Case
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-3 py-5 sm:px-6 sm:py-6">
        {/* Saved Status Alert */}
        {savedStatusMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>✓ {savedStatusMsg}</span>
            <button onClick={() => setSavedStatusMsg('')} className="text-emerald-600 hover:text-emerald-900">Dismiss</button>
          </div>
        )}

        {/* Wizard Stepper Progress Bar */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Problem' },
              { step: 2, label: 'Questions' },
              { step: 3, label: 'Evidence & Docs' },
              { step: 4, label: 'Roadmap & Authorities' },
              { step: 5, label: 'Generate Drafts' },
            ].map((s, idx, arr) => (
              <div key={s.step} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => {
                    if (analysis || s.step === 1) setWizardStep(s.step);
                  }}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    wizardStep === s.step
                      ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                      : wizardStep > s.step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {wizardStep > s.step ? '✓' : s.step}
                </button>
                <span
                  className={`hidden sm:inline-block text-xs font-semibold ${
                    wizardStep === s.step ? 'text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
                {idx < arr.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-0.5 mx-2 ${
                      wizardStep > s.step ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: PROBLEM INTAKE */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                <Sparkles size={16} /> Step 1: Legal Problem Entry
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                What legal issue are you facing?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Describe the situation in your own words. The Navigator will analyze facts, assess urgency, generate an evidence checklist, and map out appropriate legal steps.
              </p>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={5}
                placeholder="e.g. My landlord in Delhi is refusing to return my security deposit of ₹50,000 even though I vacated on time and gave 30 days notice..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              />

              {/* Sample Starter Queries */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Quick Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'My landlord is refusing to return my security deposit of ₹50,000.',
                    'My husband and in-laws are demanding dowry and harassing me.',
                    'Someone stole ₹35,000 from my bank account via an OTP phishing scam.',
                    'I bought a laptop online that arrived broken, and the seller refuses refund.',
                    'My company terminated me without notice and withheld my 2 months salary.',
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(example);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      "{example.slice(0, 55)}..."
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {analyzeError ? (
                  <p className="mr-3 text-xs font-semibold text-red-600">{analyzeError}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuery('My landlord in Delhi is refusing to return my security deposit of 50000 rupees.')}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Try sample query
                  </button>
                )}
                <button
                  onClick={() => handleAnalyze(query, answers, 2)}
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Continue to Follow-ups
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CLARIFYING QUESTIONS */}
        {wizardStep === 2 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            {!analysis ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-500">Please enter a legal problem in Step 1 first.</p>
                <button onClick={() => setWizardStep(1)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">
                  Go to Step 1
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-600">Step 2: Clarifying Questions</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">Help Us Refine Your Case Facts</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Category: {analysis.legal_category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.clarifying_questions.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
                      <label className="text-xs font-bold text-slate-800 block">{q.question}</label>
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder="Enter details..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={14} /> Back to Step 1
                  </button>
                  <button
                    onClick={() => {
                      handleAnalyze(query, answers, 3);
                    }}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                    Next: Evidence & Docs <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: EVIDENCE & DOCUMENTS */}
        {wizardStep === 3 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            {!analysis ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-500">Please complete intake in Step 1 first.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-600">Step 3: Evidence & Document Checklist</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">Organize Your Case Proof</h2>
                  </div>
                  <div className="flex gap-2 text-xs font-bold">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      Pending: {analysis.evidence_checklist.filter((e) => e.status === 'pending').length}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                      Uploaded: {analysis.evidence_checklist.filter((e) => e.status === 'uploaded').length}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                      Verified: {analysis.evidence_checklist.filter((e) => e.status === 'verified').length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Evidence Checklist Card */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CheckSquare size={16} className="text-blue-600" /> Evidence Checklist & Status
                    </h3>

                    <div className="space-y-3">
                      {analysis.evidence_checklist.map((e) => (
                        <div key={e.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {e.status === 'verified' ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              ) : e.status === 'uploaded' ? (
                                <FileCheck size={14} className="text-blue-500" />
                              ) : null}
                              {e.item}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                e.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : e.status === 'uploaded'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {e.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{e.description}</p>
                          
                          {/* Received Document Badge */}
                          {e.fileName && (
                            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                              <div className="flex items-center gap-2 truncate">
                                <FileCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="font-bold truncate">{e.fileName}</span>
                                {e.fileSize && <span className="text-[10px] text-emerald-700 dark:text-emerald-400">({e.fileSize})</span>}
                              </div>
                              {e.uploadedAt && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 font-medium">{e.uploadedAt}</span>}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            {/* File Upload Button per item */}
                            <div>
                              <input
                                type="file"
                                id={`file-input-${e.id}`}
                                className="hidden"
                                onChange={(ev) => {
                                  if (ev.target.files?.length) {
                                    handleFileUpload(ev.target.files[0], e.id);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`file-input-${e.id}`}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition"
                              >
                                <Upload size={12} /> {e.fileName ? 'Replace File' : 'Upload Proof'}
                              </label>
                            </div>

                            <div className="flex gap-1">
                              {(['pending', 'uploaded', 'verified'] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleToggleEvidence(e.id, st)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                                    e.status === st
                                      ? st === 'verified'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : st === 'uploaded'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-700 text-white'
                                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Drag & Drop File Upload Box */}
                    <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 p-6 text-center space-y-2">
                      <Upload size={26} className="mx-auto text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Evidence / Attachments</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Drag & drop proof files (PDF, JPEG, PNG, MP4, MP3)</p>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="evidence-file-input-step3"
                      />
                      <label
                        htmlFor="evidence-file-input-step3"
                        className="inline-block cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                      >
                        Browse & Upload Document
                      </label>
                    </div>
                  </div>

                  {/* Required Documents Guide */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText size={16} className="text-indigo-600" /> Required Documents Guide
                    </h3>

                    <div className="space-y-3">
                      {analysis.required_documents.map((doc, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {doc.status === 'uploaded' ? <CheckCircle2 size={14} className="text-emerald-500" /> : null}
                              {doc.doc_name}
                            </h4>
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {doc.accepted_formats}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Why Needed:</strong> {doc.why_needed}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Where to Obtain:</strong> {doc.where_to_obtain}</p>
                          
                          {/* Attached File Badge */}
                          {doc.fileName && (
                            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/40 p-2 text-xs text-emerald-900 dark:text-emerald-200 mt-2">
                              <div className="flex items-center gap-1.5 truncate">
                                <FileCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="font-bold truncate">{doc.fileName}</span>
                                {doc.fileSize && <span className="text-[10px] text-emerald-700 dark:text-emerald-400">({doc.fileSize})</span>}
                              </div>
                              {doc.uploadedAt && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">{doc.uploadedAt}</span>}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <input
                              type="file"
                              id={`req-doc-file-${idx}`}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.length) {
                                  handleUploadRequiredDoc(idx, e.target.files[0]);
                                }
                              }}
                            />
                            <label
                              htmlFor={`req-doc-file-${idx}`}
                              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700 transition"
                            >
                              <Upload size={12} /> {doc.fileName ? 'Replace Copy' : 'Upload Document Copy'}
                            </label>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${doc.status === 'uploaded' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {doc.status === 'uploaded' ? 'Uploaded' : 'Pending Upload'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600"
                  >
                    <ArrowLeft size={14} /> Back to Step 2
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    Next: Roadmap & Authorities <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: ROADMAP & AUTHORITIES */}
        {wizardStep === 4 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            {!analysis ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-500">Please run case intake first.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-600">Step 4: Action Roadmap & Authorities</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">Personalized Legal Action Plan</h2>
                  </div>
                  <button
                    onClick={handleSaveCase}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                  >
                    <Save size={14} /> Save Case
                  </button>
                </div>

                {/* Chronological Action Plan Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Immediate Actions (Do Right Now)
                    </h4>
                    {analysis.action_plan.immediate_actions.map((act) => (
                      <div key={act.step} className="rounded-xl border border-red-100 bg-white p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-900">{act.step}. {act.title}</p>
                        <p className="text-[11px] text-slate-600"><strong>Why:</strong> {act.why_it_matters}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                      <Clock size={14} /> Within 24 Hours
                    </h4>
                    {analysis.action_plan.actions_24h.map((act) => (
                      <div key={act.step} className="rounded-xl border border-amber-100 bg-white p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-900">{act.step}. {act.title}</p>
                        <p className="text-[11px] text-slate-600"><strong>Why:</strong> {act.why_it_matters}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authorities Section */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Shield size={16} className="text-blue-600" /> Recommended Authorities to Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysis.authorities.map((auth, idx) => (
                      <div key={idx} className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{auth.name}</h4>
                          <a
                            href={auth.official_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe size={12} /> Portal ↗
                          </a>
                        </div>
                        <p className="text-xs text-slate-600"><strong>Role:</strong> {auth.role}</p>
                        <p className="text-xs text-slate-600"><strong>When to Contact:</strong> {auth.when_to_contact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600"
                  >
                    <ArrowLeft size={14} /> Back to Step 3
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(analysis.draft_type)}
                    disabled={loadingDraft}
                    className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    {loadingDraft ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate {analysis.draft_type} <ArrowRight size={14} />
                  </button>
                </div>
                {draftError && (
                  <p className="pt-2 text-xs font-semibold text-red-600">{draftError}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 5: DRAFT GENERATOR */}
        {wizardStep === 5 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600">Step 5: Automated Draft Document</span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{draftTitle || 'Draft Document'}</h2>
              </div>
              {draftContent && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyDraft}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadDraft}
                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Download size={13} /> Download .TXT
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={16}
              placeholder="Generated draft text will appear here..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-slate-100 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setWizardStep(4)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600"
              >
                <ArrowLeft size={14} /> Back to Step 4
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                View Saved Cases Dashboard ➔
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
