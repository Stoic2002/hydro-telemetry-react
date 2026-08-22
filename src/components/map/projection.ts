/**
 * Penyesuaian titik pusat proyeksi peta.
 *
 * Sakelar radar dan legenda melayang di sisi kanan peta dan menutupi sebagian
 * daratan. Menggeser gambar peta ke kiri membuat wilayah yang tertutup panel
 * berkurang, tanpa mengubah ukuran maupun skala peta.
 */

/** Lebar panel melayang di sisi kanan, termasuk jaraknya dari tepi. */
export const RIGHT_PANEL_GUTTER_PX = 228;

/** Di bawah lebar ini panel menumpuk hampir selebar peta; pergeseran dilewati. */
const MIN_WIDTH_FOR_SHIFT_PX = 640;

/**
 * Mengubah pergeseran horizontal dalam piksel menjadi selisih bujur.
 *
 * Pada proyeksi Mercator, `x = skala * (bujur - bujurPusat) + lebar / 2`.
 * Menaikkan bujur pusat menggeser gambar ke kiri, dan besarnya berbanding lurus
 * dengan skala — itulah sebabnya pergeseran dihitung, bukan ditulis tetap.
 */
export function pixelShiftToLongitude(shiftPx: number, scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return 0;

  return (shiftPx / scale) * (180 / Math.PI);
}

/**
 * Besar pergeseran ke kiri untuk lebar peta tertentu. Bernilai nol pada layar
 * sempit, dan tidak pernah melebihi seperempat lebar peta agar daratan tetap
 * berada di dalam bingkai.
 */
export function horizontalShiftForWidth(mapWidth: number): number {
  if (mapWidth < MIN_WIDTH_FOR_SHIFT_PX) return 0;

  return Math.min(RIGHT_PANEL_GUTTER_PX / 2, mapWidth / 4);
}
