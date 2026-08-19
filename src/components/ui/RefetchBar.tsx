/**
 * Indikator refetch: garis tipis di atas tabel, isi tabel tetap tampil.
 * Jangan mengosongkan tabel saat data sedang diperbarui.
 */
export default function RefetchBar({ isRefetching }: { isRefetching: boolean }) {
  return (
    <div aria-hidden="true" className="h-0.5 shrink-0">
      {isRefetching && <div className="refetch-bar" />}
    </div>
  );
}
