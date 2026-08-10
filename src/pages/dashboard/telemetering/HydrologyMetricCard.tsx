import { useState, type RefObject } from 'react';
import { ChevronDown, ChevronUp, Upload } from 'lucide-react';
import type { DailyTelemetryUploadTarget } from '../../../features/telemetry-upload/model';
import type {
  MetricSection,
  MetricSource,
} from './presentation';

const sourceClasses: Record<MetricSource, string> = {
  api: 'text-[#0e7490]',
  formula: 'text-[#b45309]',
  input: 'text-[#64748b]',
  unavailable: 'text-[#dc2626]',
  constant: 'text-[#94a3b8]',
};

interface HydrologyMetricCardProps {
  cardRef?: RefObject<HTMLElement | null>;
  isHighlighted?: boolean;
  onHighlightChange?: (isHighlighted: boolean) => void;
  title: string;
  subtitle?: string;
  sections: MetricSection[];
  onUpload?: (target: DailyTelemetryUploadTarget) => void;
}

export function HydrologyMetricCard({
  cardRef,
  isHighlighted = false,
  onHighlightChange,
  title,
  subtitle,
  sections,
  onUpload,
}: HydrologyMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const compactRowLimit = 5;
  const rowCount = sections.reduce((total, section) => total + section.rows.length, 0);
  const visibleSections = sections.map((section, sectionIndex) => {
    const precedingRowCount = sections
      .slice(0, sectionIndex)
      .reduce((total, precedingSection) => total + precedingSection.rows.length, 0);
    const remainingVisibleRows = Math.max(0, compactRowLimit - precedingRowCount);
    const rows = isExpanded
      ? section.rows
      : section.rows.slice(0, remainingVisibleRows);
    return { ...section, rows };
  });
  const canToggle = rowCount > compactRowLimit;

  return (
    <article
      ref={cardRef}
      tabIndex={-1}
      onPointerEnter={() => onHighlightChange?.(true)}
      onPointerLeave={() => onHighlightChange?.(false)}
      onFocusCapture={() => onHighlightChange?.(true)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        onHighlightChange?.(false);
      }}
      className={`overflow-hidden border bg-white outline-none transition-[border-color,box-shadow] duration-200 ${
        isHighlighted
          ? 'border-cyan-400 shadow-[0_0_0_3px_rgba(34,211,238,0.14)]'
          : 'border-[#e2e8f0]'
      }`}
    >
      <div className="border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>}
      </div>

      {visibleSections.map((section) => (
        <section key={section.title}>
          {visibleSections.length > 1 && (
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                {section.title}
              </h4>
            </div>
          )}
          <div className="divide-y divide-[#f1f5f9] px-5">
            {section.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-5 text-[#475569]">{row.label}</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${sourceClasses[row.sourceType]}`}>
                    {row.source}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 whitespace-nowrap text-right">
                  <div>
                    <span className={`text-sm font-semibold ${
                      row.sourceType === 'unavailable' ? 'text-[#dc2626]' : 'text-[#0f172a]'
                    }`}
                    >
                      {row.value}
                    </span>
                    {row.unit && <span className="ml-1 text-[10px] text-[#94a3b8]">{row.unit}</span>}
                  </div>
                  {row.uploadTarget && onUpload && (
                    <button
                      type="button"
                      onClick={() => onUpload(row.uploadTarget!)}
                      className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-cyan-700 transition-colors hover:text-cyan-800"
                    >
                      <Upload size={12} />
                      {row.hasData ? 'Edit data' : 'Input data'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {canToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-50 hover:text-cyan-800"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Ringkas parameter' : `Lihat semua (${rowCount})`}
        </button>
      )}
    </article>
  );
}

export function GenericHydrologySchematic({ plantName }: { plantName: string }) {
  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">Skema Hidrologi</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px] p-5">
          <svg
            viewBox="0 0 1040 280"
            className="h-[280px] w-full"
            role="img"
            aria-label={`Skema aliran hidrologi PLTA ${plantName}`}
          >
            <defs>
              <pattern id="schematic-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
              <marker id="schematic-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0 0V6L9 3Z" fill="#0891b2" />
              </marker>
            </defs>

            <rect width="1040" height="280" rx="10" fill="#f8fafc" />
            <rect width="1040" height="280" rx="10" fill="url(#schematic-grid)" />

            <path
              d="M106 168H266C322 168 342 207 408 207H483"
              fill="none"
              markerEnd="url(#schematic-arrow)"
              stroke="#0891b2"
              strokeLinecap="round"
              strokeWidth="8"
            />
            <path
              d="M560 207H659"
              fill="none"
              markerEnd="url(#schematic-arrow)"
              stroke="#0891b2"
              strokeLinecap="round"
              strokeWidth="8"
            />
            <path
              d="M744 207H939"
              fill="none"
              markerEnd="url(#schematic-arrow)"
              stroke="#0891b2"
              strokeLinecap="round"
              strokeWidth="8"
            />

            <g>
              <rect x="45" y="87" width="150" height="82" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <text x="120" y="117" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">HULU</text>
              <text x="120" y="140" textAnchor="middle" fill="#64748b" fontSize="11">Catchment &amp; inflow</text>
            </g>

            <g>
              <path
                d="M290 109C328 83 368 84 402 101C438 119 464 96 503 107V205H290Z"
                fill="#cffafe"
                stroke="#0891b2"
                strokeWidth="2"
              />
              <text x="397" y="145" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">WADUK</text>
              <text x="397" y="167" textAnchor="middle" fill="#64748b" fontSize="11">{plantName}</text>
            </g>

            <g>
              <path d="M518 72H552L573 220H532Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
              <text x="546" y="51" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">DAM</text>
              <text x="546" y="239" textAnchor="middle" fill="#64748b" fontSize="11">Spillway</text>
            </g>

            <g>
              <rect x="630" y="106" width="145" height="100" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="702" cy="143" r="18" fill="#ecfeff" stroke="#0891b2" strokeWidth="2" />
              <path d="M702 129V157M688 143H716" stroke="#0891b2" strokeWidth="2" />
              <text x="702" y="182" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="700">POWERHOUSE</text>
            </g>

            <g>
              <rect x="845" y="87" width="150" height="82" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <text x="920" y="117" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">HILIR</text>
              <text x="920" y="140" textAnchor="middle" fill="#64748b" fontSize="11">Tailrace &amp; downstream</text>
            </g>

            <text x="221" y="157" textAnchor="middle" fill="#64748b" fontSize="10">Inflow</text>
            <text x="610" y="196" textAnchor="middle" fill="#64748b" fontSize="10">Debit turbin</text>
            <text x="806" y="196" textAnchor="middle" fill="#64748b" fontSize="10">Outflow</text>
          </svg>
        </div>
      </div>
    </article>
  );
}

