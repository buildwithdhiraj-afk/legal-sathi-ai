'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Copy,
  FileText,
  Globe,
  Info,
  ListChecks,
  Scale,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import Markdown from './markdown';
import LegalSourceChips, { SourceReference } from './LegalSourceChips';

export type LegalResponse = {
  summary: string;
  applicable_law: string;
  explanation: string;
  rights: string;
  next_steps: string;
  required_documents: string;
  government_website: string;
  disclaimer: string;
  confidence_score: number;
  source_references?: SourceReference[];
};

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
};

function Section({ icon, title, children, className = '' }: SectionProps) {
  return (
    <section className={`mb-6 last:mb-0 ${className}`}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </span>
        <h3 className="text-[15px] font-bold tracking-tight text-slate-900 uppercase">
          {title}
        </h3>
      </div>
      <div className="ml-10">{children}</div>
    </section>
  );
}

function parseLines(text?: string): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <Markdown content={item} compact />
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            {i + 1}
          </span>
          <Markdown content={item} compact />
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <Markdown content={item} compact />
        </li>
      ))}
    </ul>
  );
}

export default function LegalResponseCard({ response }: { response: LegalResponse }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const rights = parseLines(response.rights);
  const nextSteps = parseLines(response.next_steps);
  const documents = parseLines(response.required_documents);
  const confidence = Math.round((response.confidence_score ?? 0) * 100);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in your browser.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const textToSpeak = `${response.summary}. ${response.applicable_law}. ${response.explanation}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = () => {
    try {
      const fullText = `LEGAL SUMMARY: ${response.summary}\n\nAPPLICABLE LAW: ${response.applicable_law}\n\nEXPLANATION: ${response.explanation}`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(fullText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const rawUrl = (response.government_website || '').trim();
  const isValidUrl = /^https:\/\/[^\s<>"]+$/i.test(rawUrl);

  return (
    <div className="space-y-0">
      {response.summary && (
        <Section icon={<Info size={17} />} title="Summary">
          <Markdown content={response.summary} />
        </Section>
      )}

      {response.applicable_law && (
        <Section icon={<Scale size={17} />} title="Applicable Law">
          <Markdown content={response.applicable_law} />
        </Section>
      )}

      <LegalSourceChips sources={response.source_references || []} />

      {response.explanation && (
        <Section icon={<BookOpen size={17} />} title="Explanation">
          <Markdown content={response.explanation} />
        </Section>
      )}

      {rights.length > 0 && (
        <Section icon={<ShieldCheck size={17} />} title="Your Rights">
          <CheckList items={rights} />
        </Section>
      )}

      {nextSteps.length > 0 && (
        <Section icon={<ListChecks size={17} />} title="Next Steps">
          <NumberedList items={nextSteps} />
        </Section>
      )}

      {documents.length > 0 && (
        <Section icon={<FileText size={17} />} title="Required Documents">
          <BulletList items={documents} />
        </Section>
      )}

      <Section icon={<Globe size={17} />} title="Official Website" className="mb-4">
        {isValidUrl ? (
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100/70 hover:underline"
          >
            <Globe size={16} className="shrink-0 text-blue-600" />
            <span className="break-all underline-offset-2">{rawUrl}</span>
            <span
              aria-hidden
              className="ml-auto text-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
            >
              ↗
            </span>
          </a>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs sm:text-sm leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">
              No verified official government webpage was found for this specific topic.
            </p>
            <p className="mt-1">
              Please visit{' '}
              <a
                href="https://www.indiacode.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 underline hover:text-blue-700"
              >
                https://www.indiacode.nic.in
              </a>{' '}
              to search for the relevant Act.
            </p>
          </div>
        )}
      </Section>

      {response.disclaimer && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Legal Disclaimer</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800/90">
                {response.disclaimer}
              </p>
            </div>
          </div>
        </div>
      )}

      {typeof response.confidence_score === 'number' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/navigator?q=${encodeURIComponent(response.summary || '')}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
            >
              <Sparkles size={14} />
              <span>Analyze in Case Navigator</span>
            </Link>
            <button
              onClick={handleSpeak}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                speaking ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Volume2 size={14} />
              <span>{speaking ? 'Stop Audio' : 'Listen Audio'}</span>
            </button>
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Confidence {confidence}%
          </span>
        </div>
      )}
    </div>
  );
}
