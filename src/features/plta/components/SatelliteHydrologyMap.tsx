import type { RefObject } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import {
  DAM_IMAGERY_VIEWBOX,
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

interface ZonePresentation {
  label: string;
  detail: string;
  color: string;
  labelOffset: {
    x: number;
    y: number;
  };
}

const ZONES: HydrologyZone[] = ['upstream', 'dam', 'downstream'];

const zonePresentation: Record<HydrologyZone, ZonePresentation> = {
  upstream: {
    label: 'Hulu',
    detail: 'Tampungan & inflow',
    color: '#22d3ee',
    labelOffset: { x: -188, y: -88 },
  },
  dam: {
    label: 'Dam',
    detail: 'Spillway & intake',
    color: '#f59e0b',
    labelOffset: { x: 24, y: -26 },
  },
  downstream: {
    label: 'Hilir',
    detail: 'Tailrace & outflow',
    color: '#34d399',
    labelOffset: { x: -188, y: 36 },
  },
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
    <article className="relative z-10 overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">Citra Satelit</h3>
      </div>

      <figure
        ref={mapRef}
        className="relative h-[400px] overflow-hidden bg-[#0f172a] sm:aspect-[8/5] sm:h-auto"
      >
        <svg
          viewBox={`0 0 ${DAM_IMAGERY_VIEWBOX.width} ${DAM_IMAGERY_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
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
            preserveAspectRatio="xMidYMid meet"
            onError={onImageError}
          />
          <rect
            width={DAM_IMAGERY_VIEWBOX.width}
            height={DAM_IMAGERY_VIEWBOX.height}
            fill="#020617"
            opacity="0.08"
            pointerEvents="none"
          />

          {ZONES.map((zone) => {
            const { x, y } = projectAnchor(imagery, zone);
            const presentation = zonePresentation[zone];
            const isActive = activeZone === zone;
            const isMuted = activeZone !== null && !isActive;
            const labelWidth = 164;
            const labelHeight = 52;

            return (
              <g
                key={zone}
                transform={`translate(${x} ${y})`}
                role="button"
                tabIndex={0}
                aria-label={`Tampilkan parameter ${presentation.label}`}
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
                style={{ opacity: isMuted ? 0.56 : 1 }}
              >
                <circle
                  r={isActive ? 30 : 25}
                  fill={presentation.color}
                  opacity={isActive ? 0.22 : 0.14}
                  className="transition-all duration-200"
                />
                <circle
                  r={isActive ? 17 : 14}
                  fill="#ffffff"
                  stroke={presentation.color}
                  strokeWidth={isActive ? 7 : 5}
                  vectorEffect="non-scaling-stroke"
                  className="transition-all duration-200"
                />
                <circle
                  data-hydrology-anchor-point={zone}
                  r="6"
                  fill={presentation.color}
                />

                <g
                  transform={`translate(${presentation.labelOffset.x} ${presentation.labelOffset.y})`}
                  pointerEvents="none"
                >
                  <rect
                    width={labelWidth}
                    height={labelHeight}
                    rx="10"
                    fill="#020617"
                    fillOpacity={isActive ? 0.94 : 0.82}
                    stroke={presentation.color}
                    strokeOpacity={isActive ? 1 : 0.72}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x="14"
                    y="21"
                    fill="#ffffff"
                    fontSize="16"
                    fontWeight="700"
                  >
                    {presentation.label}
                    <tspan
                      x="14"
                      dy="18"
                      fill="#cbd5e1"
                      fontSize="11"
                      fontWeight="500"
                    >
                      {presentation.detail}
                    </tspan>
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#020617]/90 via-[#020617]/45 to-transparent px-5 pb-4 pt-20 text-white">
          <figcaption>
            <p className="text-sm font-semibold">{imagery.damName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
              <MapPin size={12} aria-hidden="true" />
              {imagery.location}
            </p>
            <p className="mt-1 text-[10px] text-white/60">{imagery.acquisitionLabel}</p>
          </figcaption>
          <a
            href={imagery.attributionUrl}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto mt-2 inline-flex items-center gap-1 text-[10px] text-white/60 transition-colors hover:text-white"
          >
            World Imagery — {imagery.attribution}
            <ExternalLink size={10} aria-hidden="true" />
          </a>
        </div>

        <a
          href={imagery.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute right-4 top-4 z-30 inline-flex items-center gap-1.5 bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#0f172a] shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          Buka peta satelit
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </figure>
    </article>
  );
}
