// Legacy PJT fixtures retained for the telemetering prototype components.
export const PJT_HISTORICAL_DATA = [
  { timestamp: '2026-05-11T00:00:00', rainfall: 0.00, waterLevel: 137.15 },
  { timestamp: '2026-05-11T01:00:00', rainfall: 0.20, waterLevel: 137.20 },
  { timestamp: '2026-05-11T02:00:00', rainfall: 0.00, waterLevel: 137.24 },
  { timestamp: '2026-05-11T03:00:00', rainfall: 0.00, waterLevel: 137.22 },
  { timestamp: '2026-05-11T04:00:00', rainfall: 0.00, waterLevel: 137.18 },
  { timestamp: '2026-05-11T05:00:00', rainfall: 0.00, waterLevel: 137.15 },
  { timestamp: '2026-05-11T06:00:00', rainfall: 0.00, waterLevel: 137.12 },
  { timestamp: '2026-05-11T07:00:00', rainfall: 0.00, waterLevel: 137.10 },
  { timestamp: '2026-05-11T08:00:00', rainfall: 0.00, waterLevel: 137.08 },
  { timestamp: '2026-05-11T09:00:00', rainfall: 0.00, waterLevel: 137.05 },
  { timestamp: '2026-05-11T10:00:00', rainfall: 0.00, waterLevel: 137.02 },
  { timestamp: '2026-05-11T11:00:00', rainfall: 0.00, waterLevel: 137.00 },
  { timestamp: '2026-05-11T12:00:00', rainfall: 0.00, waterLevel: 136.98 },
];

export const PJT_RAINFALL_DATA = [
  {
    id: 'pjt-rf-1',
    name: 'Sempor',
    coordinates: { x: 109.491152, y: -7.572216 },
    value: 0.20,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.20,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 01:00'
  },
  {
    id: 'pjt-rf-2',
    name: 'Wadaslintang',
    coordinates: { x: 109.78338, y: -7.610578 },
    value: 0.00,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.00,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 12:00'
  },
  {
    id: 'pjt-rf-3',
    name: 'Bd. Pejengkolan',
    coordinates: { x: 109.7727279, y: -7.658433 },
    value: 0.00,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.00,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 12:00'
  },
  {
    id: 'pjt-rf-4',
    name: 'Sumbersari',
    coordinates: { x: 109.7710228, y: -7.5803399 },
    value: 0.00,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.00,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 12:00'
  },
  {
    id: 'pjt-rf-5',
    name: 'Medono',
    coordinates: { x: 109.852083, y: -7.5035 },
    value: 0.00,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.00,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 12:00'
  },
  {
    id: 'pjt-rf-6',
    name: 'Ketenger',
    coordinates: { x: 109.2129, y: -7.360503 },
    value: 0.00,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.00,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 12:00'
  },
  {
    id: 'pjt-rf-7',
    name: 'Garung',
    coordinates: { x: 109.929277, y: -7.272717 },
    value: 0.00,
    unit: 'mm',
    secondaryLabel: 'Intensitas',
    secondaryValue: 0.00,
    secondaryUnit: 'mm/jam',
    lastTx: '2026-05-11 12:00'
  }
];

export const PJT_WATER_DATA = PJT_RAINFALL_DATA.map(item => ({
  ...item,
  id: item.id.replace('rf', 'wl'),
  value: 137.15 + (Math.random() * 0.1), // Dummy water level values near Sempor's historical start
  unit: 'mdpl',
  secondaryLabel: 'Status',
  secondaryValue: undefined,
  secondaryUnit: 'Aman'
}));
