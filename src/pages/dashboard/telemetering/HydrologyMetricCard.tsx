import { useState, type RefObject } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HYDROLOGY_ZONE_PRESENTATION, type HydrologyZone } from '../../../features/plta/dam-imagery';
import SourceMarker from '../../../components/atoms/SourceMarker';
import type { MetricSection } from './presentation';
import type { DailyTelemetryUploadTarget } from '../../../features/telemetry-upload/model';

interface HydrologyMetricCardProps {
  cardRef?: RefObject<HTMLElement | null>;
  zone: HydrologyZone;
  isHighlighted?: boolean;
  onHighlightChange?: (isHighlighted: boolean) => void;
  sections: MetricSection[];
  onUpload?: (target: DailyTelemetryUploadTarget) => void;
}

export function HydrologyMetricCard({
  cardRef,
  zone,
  isHighlighted = false,
  onHighlightChange,
  sections,
  onUpload,
}: HydrologyMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const presentation = HYDROLOGY_ZONE_PRESENTATION[zone];
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
      className={`flex h-full flex-col outline-none transition-colors duration-200 ${presentation.columnClassName} ${
        isHighlighted ? 'ring-2 ring-inset ring-cyan-400' : ''
      }`}
    >
      <div className={`flex items-center justify-between gap-2 border-b px-4 py-2.5 ${presentation.borderClassName}`}>
        <div className="flex items-center gap-2">
          <span className={`flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${presentation.badgeClassName}`}>
            {presentation.order}
          </span>
          <h3 className="text-[13px] font-semibold text-text-primary">{presentation.title}</h3>
        </div>
        <span className="shrink-0 text-[11px] text-text-muted">{rowCount} parameter</span>
      </div>

      {visibleSections.map((section) => (
        <section key={section.title} className="flex-1">
          {visibleSections.length > 1 && (
            <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
              {section.title}
            </div>
          )}
          <div className={`divide-y ${presentation.dividerClassName} px-4`}>
            {section.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[12.5px] text-text-secondary">{row.label}</span>
                  <SourceMarker type={row.sourceType} />
                  {row.uploadTarget && onUpload && (
                    <button
                      type="button"
                      onClick={() => onUpload(row.uploadTarget!)}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[10.5px] font-semibold text-brand-primary-strong transition-colors hover:text-cyan-800"
                    >
                      {row.hasData ? 'Edit data' : 'Input data'}
                    </button>
                  )}
                </div>
                <span className="shrink-0 whitespace-nowrap text-right font-mono text-[13px] font-medium text-text-primary">
                  {row.value}
                  {row.unit && <span className="ml-1 text-[11px] font-normal text-text-muted">{row.unit}</span>}
                </span>
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
          className="flex cursor-pointer items-center gap-1 px-4 py-2.5 text-left text-[11.5px] font-semibold text-brand-primary-strong transition-colors hover:text-cyan-800"
        >
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {isExpanded ? 'Ringkas parameter' : `Lihat semua (${rowCount})`}
        </button>
      )}
    </article>
  );
}

export function GenericHydrologySchematic({ plantName }: { plantName: string }) {
  return (
    <article className="overflow-hidden rounded-md border border-border-subtle bg-white">
      <div className="border-b border-border-subtle px-5 py-4">
        <h3 className="text-[15px] font-semibold text-text-primary">Skema Hidrologi</h3>
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
