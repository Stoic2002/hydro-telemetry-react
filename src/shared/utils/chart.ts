/**
 * Rentang sumbu Y untuk grafik nilai terukur.
 *
 * Recharts memaku sumbu Y di nol kalau domain tidak diberikan. Untuk parameter
 * yang nilainya jauh di atas nol — inflow, TMA waduk — seluruh garis jadi
 * menumpuk di pinggir atas dan tidak lagi terbaca terhadap garis bantunya.
 */
export function chartValueDomain(values: number[]): [number, number] {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length === 0) return [0, 1];

  const minimumValue = Math.min(...finiteValues);
  const maximumValue = Math.max(...finiteValues);
  const valueRange = maximumValue - minimumValue;

  // Rentang datar tetap perlu ruang agar garisnya tidak menempel di tepi, tapi
  // padding-nya tidak boleh sampai menenggelamkan datanya sendiri.
  const padding = valueRange > 0
    ? valueRange * 0.12
    : Math.max(Math.abs(maximumValue) * 0.02, 0.5);

  return [
    minimumValue >= 0 ? Math.max(0, minimumValue - padding) : minimumValue - padding,
    maximumValue + padding,
  ];
}
