import type { Plant } from './model';
import { plantMatchesIdentity } from './presentation';

export type HydrologyZone = 'upstream' | 'dam' | 'downstream';

export interface DamImageryExtent {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface DamImageryAnchor {
  latitude: number;
  longitude: number;
}

export interface DamImagery {
  damName: string;
  location: string;
  acquisitionLabel: string;
  extent: DamImageryExtent;
  anchors: Record<HydrologyZone, DamImageryAnchor>;
  imageUrl: string;
  mapUrl: string;
  alt: string;
  attribution: string;
  attributionUrl: string;
}

interface DamImageryDefinition extends DamImagery {
  identities: string[];
}

const WORLD_IMAGERY_EXPORT_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export';
const WORLD_IMAGERY_SERVICE_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';
const WORLD_IMAGERY_ATTRIBUTION =
  'Esri, Vantor, Earthstar Geographics, dan GIS User Community';
export const DAM_IMAGERY_VIEWBOX = {
  width: 1600,
  height: 1000,
} as const;

function worldImageryUrl(extent: DamImageryExtent): string {
  const params = new URLSearchParams({
    bbox: [extent.west, extent.south, extent.east, extent.north].join(','),
    bboxSR: '4326',
    imageSR: '4326',
    size: `${DAM_IMAGERY_VIEWBOX.width},${DAM_IMAGERY_VIEWBOX.height}`,
    format: 'jpg',
    f: 'image',
  });

  return `${WORLD_IMAGERY_EXPORT_URL}?${params.toString()}`;
}

function satelliteMapUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    api: '1',
    map_action: 'map',
    center: `${latitude},${longitude}`,
    zoom: '16',
    basemap: 'satellite',
  });

  return `https://www.google.com/maps/@?${params.toString()}`;
}

const SOEDIRMAN_EXTENT: DamImageryExtent = {
  west: 109.59817,
  south: -7.397,
  east: 109.61353,
  north: -7.3874,
};

const WONOGIRI_EXTENT: DamImageryExtent = {
  west: 110.9137,
  south: -7.846,
  east: 110.9393,
  north: -7.83,
};

const DAM_IMAGERY: DamImageryDefinition[] = [
  {
    identities: ['soedirman', 'mrica', 'pbs'],
    damName: 'Bendungan Panglima Besar Soedirman (Mrica)',
    location: 'Banjarnegara, Jawa Tengah',
    acquisitionLabel: 'Akuisisi 23 Juli 2025 · resolusi 0,34 m',
    extent: SOEDIRMAN_EXTENT,
    anchors: {
      upstream: { latitude: -7.3898, longitude: 109.60969 },
      dam: { latitude: -7.392557, longitude: 109.605829 },
      downstream: { latitude: -7.3946, longitude: 109.603392 },
    },
    imageUrl: worldImageryUrl(SOEDIRMAN_EXTENT),
    mapUrl: satelliteMapUrl(-7.392557, 109.605829),
    alt: 'Citra satelit Bendungan Panglima Besar Soedirman atau Waduk Mrica di Banjarnegara',
    attribution: WORLD_IMAGERY_ATTRIBUTION,
    attributionUrl: WORLD_IMAGERY_SERVICE_URL,
  },
  {
    identities: ['wonogiri', 'gajahmungkur', 'wng'],
    damName: 'Bendungan Wonogiri (Gajah Mungkur)',
    location: 'Wonogiri, Jawa Tengah',
    acquisitionLabel: 'Akuisisi 22 Juli 2025 · resolusi 0,34 m',
    extent: WONOGIRI_EXTENT,
    anchors: {
      upstream: { latitude: -7.84184, longitude: 110.930084 },
      dam: { latitude: -7.838139, longitude: 110.926581 },
      downstream: { latitude: -7.8332, longitude: 110.926244 },
    },
    imageUrl: worldImageryUrl(WONOGIRI_EXTENT),
    mapUrl: satelliteMapUrl(-7.8381, 110.9266),
    alt: 'Citra satelit Bendungan Wonogiri atau Waduk Gajah Mungkur di Wonogiri',
    attribution: WORLD_IMAGERY_ATTRIBUTION,
    attributionUrl: WORLD_IMAGERY_SERVICE_URL,
  },
];

export function getDamImagery(
  plant: Pick<Plant, 'code' | 'name'>,
): DamImagery | null {
  const match = DAM_IMAGERY.find(({ identities }) => (
    identities.some((identity) => plantMatchesIdentity(plant, identity))
  ));

  if (!match) return null;

  return {
    damName: match.damName,
    location: match.location,
    acquisitionLabel: match.acquisitionLabel,
    extent: match.extent,
    anchors: match.anchors,
    imageUrl: match.imageUrl,
    mapUrl: match.mapUrl,
    alt: match.alt,
    attribution: match.attribution,
    attributionUrl: match.attributionUrl,
  };
}
