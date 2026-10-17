'use client';

import { Scale } from 'lucide-react';

export type SourceReference = {
  act: string;
  section: string;
};

type Props = {
  sources: SourceReference[];
};

function indiaCodeSearchUrl(act: string, section: string): string {
  const query = `${act} ${section}`.trim();
  return `https://www.indiacode.nic.in/handle/123456789/1362/simple-search?query=${encodeURIComponent(query)}`;
}

export default function LegalSourceChips({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Scale size={16} />
        </span>
        <h3 className="text-[15px] font-bold tracking-tight text-slate-900 uppercase">
          Cited Sources
        </h3>
      </div>
      <div className="ml-10 flex flex-wrap gap-2">
        {sources.map((src, i) => (
          <a
            key={`${src.act}-${src.section}-${i}`}
            href={indiaCodeSearchUrl(src.act, src.section)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
            title={`Open ${src.act}, ${src.section} on India Code`}
          >
            <span className="max-w-[220px] truncate">{src.act}</span>
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
              {src.section}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}