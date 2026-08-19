import type { RefObject } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  DAM_IMAGERY_VIEWBOX,
  HYDROLOGY_ZONES,
  HYDROLOGY_ZONE_PRESENTATION,
  type DamImagery,
  type HydrologyZone,
} from '../dam-imagery';

interface SatelliteHydrologyMapProps {
  imagery: DamImagery;
  activeZone: HydrologyZone | null;
  mapRef: RefObject<HTMLElement | null>;
  onActiveZoneChange: (zone: HydrologyZone | null) => void;
  onImageError: () => void;
  onZoneSelect: (zone: HydrologyZone) => void;
}

const MARKER_HALO: Record<HydrologyZone, string> = {
  upstream: 'rgba(34,211,238,.24)',
  dam: 'rgba(245,158,11,.24)',
  downstream: 'rgba(52,211,153,.24)',
};

function projectAnchor(imagery: DamImagery, zone: HydrologyZone) {
  const anchor = imagery.anchors[zone];
  const { extent } = imagery;
  const longitudeRange = extent.east - extent.west;
  const latitudeRange = extent.north - extent.south;

  return {
    x: ((anchor.longitude - extent.west) / longitudeRange) * DAM_IMAGERY_VIEWBOX.width,
    y: ((extent.north - anchor.latitude) / latitudeRange) * DAM_IMAGERY_VIEWBOX.height,
  };
}

export default function SatelliteHydrologyMap({
  imagery,
  activeZone,
  mapRef,
  onActiveZoneChange,
  onImageError,
  onZoneSelect,
}: SatelliteHydrologyMapProps) {
  return (
    <figure
      ref={mapRef}
      className="relative aspect-[2/1] max-h-[480px] min-h-[320px] w-full overflow-hidden bg-[#0f172a]"
    >
      <svg
        viewBox={`0 0 ${DAM_IMAGERY_VIEWBOX.width} ${DAM_IMAGERY_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid slice"
        role="group"
        aria-label={`Pemetaan hidrologi ${imagery.damName}`}
        className="absolute inset-0 h-full w-full"
      >
        <title>Pemetaan titik hulu, bendungan, dan hilir pada {imagery.damName}</title>
        <image
          href={imagery.imageUrl}
          x="0"
          y="0"
          width={DAM_IMAGERY_VIEWBOX.width}
          height={DAM_IMAGERY_VIEWBOX.height}
          preserveAspectRatio="xMidYMid slice"
          onError={onImageError}
        />
        <rect
          width={DAM_IMAGERY_VIEWBOX.width}
          height={DAM_IMAGERY_VIEWBOX.height}
          fill="#020617"
          opacity="0.08"
          pointerEvents="none"
        />

        {HYDROLOGY_ZONES.map((zone) => {
          const { x, y } = projectAnchor(imagery, zone);
          const presentation = HYDROLOGY_ZONE_PRESENTATION[zone];
          const isActive = activeZone === zone;
          const isMuted = activeZone !== null && !isActive;
          const radius = isActive ? 15 : 13;

          return (
            <g
              key={zone}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex={0}
              aria-label={`Sorot parameter ${presentation.title}`}
              onClick={() => onZoneSelect(zone)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onZoneSelect(zone);
              }}
              onPointerEnter={() => onActiveZoneChange(zone)}
              onPointerLeave={() => onActiveZoneChange(null)}
              onFocus={() => onActiveZoneChange(zone)}
              onBlur={() => onActiveZoneChange(null)}
              className="cursor-pointer outline-none transition-opacity duration-200"
              style={{ opacity: isMuted ? 0.55 : 1 }}
            >
              {isActive && (
                <circle r={radius + 5} fill={MARKER_HALO[zone]} />
              )}
              <circle
                r={radius}
                className={zone === 'dam' ? 'fill-amber-500' : zone === 'upstream' ? 'fill-brand-primary' : 'fill-status-success'}
                stroke="#ffffff"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={600}
                fontSize={isActive ? 13 : 12}
                className={zone === 'dam' ? 'fill-white' : zone === 'upstream' ? 'fill-cyan-950' : 'fill-emerald-950'}
              >
                {presentation.order}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="absolute bottom-3 left-3 z-20 max-w-[min(420px,calc(100%-24px))] rounded-[4px] bg-surface-raised/85 px-2 py-1.5 backdrop-blur-[2px]">
        <p className="truncate text-[11px] font-semibold text-text-primary">{imagery.damName}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-text-subtle">
          {imagery.acquisitionLabel}
        </p>
        <a
          href={imagery.attributionUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 inline-flex max-w-full items-center gap-1 font-mono text-[10px] text-text-muted transition-colors hover:text-brand-primary-strong"
        >
          <span className="truncate">World Imagery — {imagery.attribution}</span>
          <ExternalLink size={10} className="shrink-0" aria-hidden="true" />
        </a>
      </figcaption>

      <a
        href={imagery.mapUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-sm border border-white/60 bg-surface-raised/90 px-2.5 py-1.5 text-[11px] font-semibold text-text-primary backdrop-blur transition-colors hover:bg-surface-raised"
      >
        Buka peta satelit
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    </figure>
  );
}
