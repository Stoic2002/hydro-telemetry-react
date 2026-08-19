import { useRef, useState, type RefObject } from 'react';
import SatelliteHydrologyMap from '../../../features/plta/components/SatelliteHydrologyMap';
import {
  getDamImagery,
  HYDROLOGY_ZONES,
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
  const mapRef = useRef<HTMLElement | null>(null);
  const upstreamCardRef = useRef<HTMLElement | null>(null);
  const damCardRef = useRef<HTMLElement | null>(null);
  const downstreamCardRef = useRef<HTMLElement | null>(null);

  const getCardElement = (zone: HydrologyZone): HTMLElement | null => {
    if (zone === 'upstream') return upstreamCardRef.current;
    if (zone === 'dam') return damCardRef.current;
    return downstreamCardRef.current;
  };

  const sectionsByZone: Record<HydrologyZone, MetricSection[]> = {
    upstream: upstreamSections,
    dam: damSections,
    downstream: downstreamSections,
  };
  const cardRefByZone: Record<HydrologyZone, RefObject<HTMLElement | null>> = {
    upstream: upstreamCardRef,
    dam: damCardRef,
    downstream: downstreamCardRef,
  };

  const selectZone = (zone: HydrologyZone) => {
    setActiveZone(zone);
    const card = getCardElement(zone);
    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!imagery || imageLoadFailed) {
    return (
      <>
        <div className="grid divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle bg-white lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {HYDROLOGY_ZONES.map((zone) => (
            <HydrologyMetricCard
              key={zone}
              cardRef={cardRefByZone[zone]}
              zone={zone}
              isHighlighted={activeZone === zone}
              onHighlightChange={(isHighlighted) => (
                setActiveZone((current) => (
                  isHighlighted ? zone : current === zone ? null : current
                ))
              )}
              sections={sectionsByZone[zone]}
              onUpload={onUpload}
            />
          ))}
        </div>
        <div className="mt-5">
          <GenericHydrologySchematic plantName={plantName} />
        </div>
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-white">
      <SatelliteHydrologyMap
        imagery={imagery}
        activeZone={activeZone}
        mapRef={mapRef}
        onActiveZoneChange={setActiveZone}
        onImageError={() => setFailedImageUrl(imagery.imageUrl)}
        onZoneSelect={selectZone}
      />
      <div className="grid divide-y divide-border-subtle border-t border-border-subtle lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {HYDROLOGY_ZONES.map((zone) => (
          <HydrologyMetricCard
            key={zone}
            cardRef={cardRefByZone[zone]}
            zone={zone}
            isHighlighted={activeZone === zone}
            onHighlightChange={(isHighlighted) => (
              setActiveZone((current) => (
                isHighlighted ? zone : current === zone ? null : current
              ))
            )}
            sections={sectionsByZone[zone]}
            onUpload={onUpload}
          />
        ))}
      </div>
    </div>
  );
}
