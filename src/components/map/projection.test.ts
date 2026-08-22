import { describe, expect, it } from 'vitest';
import {
  RIGHT_PANEL_GUTTER_PX,
  horizontalShiftForWidth,
  pixelShiftToLongitude,
} from './projection';

describe('pixelShiftToLongitude', () => {
  it('menghasilkan selisih bujur yang mengecil saat skala membesar', () => {
    const padaSkalaKecil = pixelShiftToLongitude(114, 10_000);
    const padaSkalaBesar = pixelShiftToLongitude(114, 40_000);

    // Pergeseran 114 piksel berarti selisih bujur lebih kecil bila petanya
    // digambar lebih besar; inilah yang membuat hasilnya konsisten di layar
    // sempit maupun lebar.
    expect(padaSkalaBesar).toBeLessThan(padaSkalaKecil);
    expect(padaSkalaBesar).toBeCloseTo(padaSkalaKecil / 4, 6);
  });

  it('membalik rumus proyeksi Mercator dengan benar', () => {
    const scale = 22_000;
    const shiftPx = 114;
    const derajat = pixelShiftToLongitude(shiftPx, scale);

    // x = skala * (bujur dalam radian); jadi derajat * pi/180 * skala harus
    // kembali ke jumlah piksel semula.
    expect((derajat * Math.PI) / 180 * scale).toBeCloseTo(shiftPx, 6);
  });

  it('tidak menghasilkan nilai tak hingga untuk skala tidak wajar', () => {
    expect(pixelShiftToLongitude(114, 0)).toBe(0);
    expect(pixelShiftToLongitude(114, Number.NaN)).toBe(0);
    expect(pixelShiftToLongitude(114, -100)).toBe(0);
  });
});

describe('horizontalShiftForWidth', () => {
  it('tidak menggeser apa pun di layar sempit', () => {
    // Di lebar ini panel melayang hampir menutupi peta; menggeser justru
    // membuang daratan keluar bingkai.
    expect(horizontalShiftForWidth(375)).toBe(0);
    expect(horizontalShiftForWidth(639)).toBe(0);
  });

  it('menggeser setengah lebar panel pada layar lebar', () => {
    expect(horizontalShiftForWidth(1200)).toBe(RIGHT_PANEL_GUTTER_PX / 2);
  });

  it('tidak pernah melebihi seperempat lebar peta', () => {
    for (const width of [640, 700, 800, 1200, 1480]) {
      expect(horizontalShiftForWidth(width)).toBeLessThanOrEqual(width / 4);
    }
  });
});
