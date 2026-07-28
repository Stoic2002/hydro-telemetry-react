import type { Plant } from './model';
import { plantMatchesIdentity } from './presentation';

export interface DamImagery {
  damName: string;
  location: string;
  acquisitionLabel: string;
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

function worldImageryUrl(bbox: [number, number, number, number]): string {
  const params = new URLSearchParams({
    bbox: bbox.join(','),
    bboxSR: '4326',
    imageSR: '4326',
    size: '1600,1000',
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

const DAM_IMAGERY: DamImageryDefinition[] = [
  {
    identities: ['soedirman', 'mrica', 'pbs'],
    damName: 'Bendungan Panglima Besar Soedirman (Mrica)',
    location: 'Banjarnegara, Jawa Tengah',
    acquisitionLabel: 'Akuisisi 23 Juli 2025 · resolusi 0,34 m',
    imageUrl: worldImageryUrl([109.5985, -7.397, 109.6132, -7.3874]),
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
    imageUrl: worldImageryUrl([110.917, -7.846, 110.936, -7.83]),
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
    imageUrl: match.imageUrl,
    mapUrl: match.mapUrl,
    alt: match.alt,
    attribution: match.attribution,
    attributionUrl: match.attributionUrl,
  };
}
