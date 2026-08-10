import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import SatelliteHydrologyMap from '../../../features/plta/components/SatelliteHydrologyMap';
import {
  getDamImagery,
  type HydrologyZone,
} from '../../../features/plta/dam-imagery';
import type { Plant } from '../../../features/plta/model';
import type { DailyTelemetryUploadTarget } from '../../../features/telemetry-upload/model';
import {
  GenericHydrologySchematic,
  HydrologyMetricCard,
} from './HydrologyMetricCard';
import type { MetricSection } from './presentation';

interface HydrologySpatialLayoutProps {
  plant: Pick<Plant, 'code' | 'name'>;
  plantName: string;
  upstreamSections: MetricSection[];
  damSections: MetricSection[];
  downstreamSections: MetricSection[];
  onUpload: (target: DailyTelemetryUploadTarget) => void;
}

interface HydrologyConnectorPath {
  zone: HydrologyZone;
  path: string;
  endX: number;
  endY: number;
}

interface HydrologyConnectorLayout {
  width: number;
  height: number;
  paths: HydrologyConnectorPath[];
}

const hydrologyZones: HydrologyZone[] = ['upstream', 'dam', 'downstream'];

const hydrologyConnectorColors: Record<HydrologyZone, string> = {
  upstream: '#22d3ee',
  dam: '#f59e0b',
  downstream: '#34d399',
};

function HydrologyConnectorOverlay({
  activeZone,
  layout,
}: {
  activeZone: HydrologyZone | null;
  layout: HydrologyConnectorLayout | null;
}) {
  if (!layout || layout.paths.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible xl:block"
    >
      {layout.paths.map((connector) => {
        const color = hydrologyConnectorColors[connector.zone];
        const isActive = activeZone === connector.zone;
        const isMuted = activeZone !== null && !isActive;

        return (
          <g key={connector.zone}>
            <path
              d={connector.path}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={isMuted ? 0.28 : 0.82}
              strokeWidth={isActive ? 7 : 6}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={connector.path}
              fill="none"
              stroke={color}
              strokeDasharray={isActive ? undefined : '7 7'}
              strokeLinecap="round"
              strokeOpacity={isMuted ? 0.2 : isActive ? 1 : 0.72}
              strokeWidth={isActive ? 3 : 2}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={connector.endX}
              cy={connector.endY}
              r={isActive ? 6 : 4.5}
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              opacity={isMuted ? 0.28 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function HydrologySpatialLayout({
  plant,
  plantName,
  upstreamSections,
  damSections,
  downstreamSections,
  onUpload,
}: HydrologySpatialLayoutProps) {
  const imagery = getDamImagery(plant);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageLoadFailed = Boolean(imagery && failedImageUrl === imagery.imageUrl);
  const [activeZone, setActiveZone] = useState<HydrologyZone | null>(null);
  const [connectorLayout, setConnectorLayout] =
    useState<HydrologyConnectorLayout | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);
  const upstreamCardRef = useRef<HTMLElement | null>(null);
  const damCardRef = useRef<HTMLElement | null>(null);
  const downstreamCardRef = useRef<HTMLElement | null>(null);
  const spatialImageUrl = imagery && !imageLoadFailed ? imagery.imageUrl : null;

  const getCardElement = useCallback((zone: HydrologyZone): HTMLElement | null => {
    if (zone === 'upstream') return upstreamCardRef.current;
    if (zone === 'dam') return damCardRef.current;
    return downstreamCardRef.current;
  }, []);

  const selectZone = useCallback((zone: HydrologyZone) => {
    setActiveZone(zone);
    const card = getCardElement(zone);

    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [getCardElement]);

  useEffect(() => {
    if (!spatialImageUrl) return undefined;

    const layoutElement = layoutRef.current;
    const mapElement = mapRef.current;

    if (!layoutElement || !mapElement) return undefined;

    let animationFrame = 0;

    const measure = () => {
      const layoutRect = layoutElement.getBoundingClientRect();
      const paths: HydrologyConnectorPath[] = [];

      hydrologyZones.forEach((zone) => {
        const anchor = mapElement.querySelector<SVGCircleElement>(
          `[data-hydrology-anchor-point="${zone}"]`,
        );
        const card = getCardElement(zone);

        if (!anchor || !card) return;

        const anchorRect = anchor.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const startX = cardRect.left + (cardRect.width / 2) - layoutRect.left;
        const startY = cardRect.bottom - layoutRect.top;
        const endX = anchorRect.left + (anchorRect.width / 2) - layoutRect.left;
        const endY = anchorRect.top + (anchorRect.height / 2) - layoutRect.top;
        const verticalDistance = Math.max(1, endY - startY);
        const controlY = startY + Math.max(52, verticalDistance * 0.48);
        const round = (value: number) => Math.round(value * 100) / 100;

        paths.push({
          zone,
          path: [
            `M ${round(startX)} ${round(startY)}`,
            `C ${round(startX)} ${round(controlY)}`,
            `${round(endX)} ${round(controlY)}`,
            `${round(endX)} ${round(endY)}`,
          ].join(' '),
          endX: round(endX),
          endY: round(endY),
        });
      });

      setConnectorLayout({
        width: Math.max(1, Math.round(layoutRect.width)),
        height: Math.max(1, Math.round(layoutRect.height)),
        paths,
      });
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(layoutElement);
    resizeObserver.observe(mapElement);
    hydrologyZones.forEach((zone) => {
      const card = getCardElement(zone);
      if (card) resizeObserver.observe(card);
    });
    window.addEventListener('resize', scheduleMeasure);
    scheduleMeasure();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver.disconnect();
    };
  }, [getCardElement, spatialImageUrl]);

  const renderCards = (className: string) => (
    <div className={className}>
      <HydrologyMetricCard
        cardRef={upstreamCardRef}
        isHighlighted={activeZone === 'upstream'}
        onHighlightChange={(isHighlighted) => (
          setActiveZone((current) => (
            isHighlighted ? 'upstream' : current === 'upstream' ? null : current
          ))
        )}
        title="Hulu"
        sections={upstreamSections}
        onUpload={onUpload}
      />
      <HydrologyMetricCard
        cardRef={damCardRef}
        isHighlighted={activeZone === 'dam'}
        onHighlightChange={(isHighlighted) => (
          setActiveZone((current) => (
            isHighlighted ? 'dam' : current === 'dam' ? null : current
          ))
        )}
        title="Bendungan"
        sections={damSections}
        onUpload={onUpload}
      />
      <HydrologyMetricCard
        cardRef={downstreamCardRef}
        isHighlighted={activeZone === 'downstream'}
        onHighlightChange={(isHighlighted) => (
          setActiveZone((current) => (
            isHighlighted ? 'downstream' : current === 'downstream' ? null : current
          ))
        )}
        title="Hilir"
        sections={downstreamSections}
        onUpload={onUpload}
      />
    </div>
  );

  if (!imagery || imageLoadFailed) {
    return (
      <>
        {renderCards('relative z-30 mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.9fr_0.9fr]')}
        <div className="mt-5">
          <GenericHydrologySchematic plantName={plantName} />
        </div>
      </>
    );
  }

  return (
    <div ref={layoutRef} className="relative">
      {renderCards('relative z-30 grid gap-5 xl:grid-cols-[1.15fr_0.9fr_0.9fr]')}
      <HydrologyConnectorOverlay
        activeZone={activeZone}
        layout={connectorLayout}
      />
      <div className="mt-5 xl:mt-16">
        <SatelliteHydrologyMap
          imagery={imagery}
          activeZone={activeZone}
          mapRef={mapRef}
          onActiveZoneChange={setActiveZone}
          onImageError={() => setFailedImageUrl(imagery.imageUrl)}
          onZoneSelect={selectZone}
        />
      </div>
    </div>
  );
}

