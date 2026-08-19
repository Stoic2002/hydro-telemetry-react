export type SourceMarkerType = 'api' | 'formula' | 'input' | 'constant' | 'unavailable';

/**
 * Penanda sumber data memakai dua kode sekaligus: bentuk (terbaca tanpa warna)
 * dan warna. Ditempel setelah label parameter, tidak pernah menyentuh angkanya.
 */
const SHAPE_CLASSES: Record<SourceMarkerType, string> = {
  api: 'size-[7px] rounded-full bg-brand-primary-strong',
  formula: 'size-[7px] rounded-full border-[1.5px] border-violet-600',
  input: 'size-[7px] bg-amber-600',
  constant: 'size-[7px] rotate-45 bg-text-muted',
  unavailable: 'h-[1.5px] w-[7px] bg-text-placeholder',
};

const LABEL_CLASSES: Record<SourceMarkerType, string> = {
  api: 'text-cyan-700',
  formula: 'text-violet-700',
  input: 'text-amber-700',
  constant: 'text-text-subtle',
  unavailable: 'text-text-muted',
};

const SOURCE_MARKER_LABEL: Record<SourceMarkerType, string> = {
  api: 'Realtime',
  formula: 'Formulasi',
  input: 'Input',
  constant: 'Konstanta',
  unavailable: 'Belum tersedia',
};

export default function SourceMarker({
  type,
  className = '',
}: {
  type: SourceMarkerType;
  className?: string;
}) {
  return <span aria-hidden="true" className={`shrink-0 ${SHAPE_CLASSES[type]} ${className}`} />;
}

/** Bentuk + label huruf kapital kecil — dipakai di baris legenda. */
export function SourceMarkerLegend({
  type,
  label,
}: {
  type: SourceMarkerType;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SourceMarker type={type} />
      <span className={`text-[9.5px] font-semibold uppercase tracking-[0.07em] ${LABEL_CLASSES[type]}`}>
        {label ?? SOURCE_MARKER_LABEL[type]}
      </span>
    </span>
  );
}
