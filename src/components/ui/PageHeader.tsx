import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Satu kalimat ringkas. Judul halaman tidak memakai ikon dekoratif. */
  description: string;
  /** Filter atau aksi utama, ditempatkan di kanan judul. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Pola header halaman yang sama di sepuluh layar: judul dan satu deskripsi di
 * kiri, filter/aksi di kanan, lalu garis 1px penuh sebagai batas ke konten.
 * Garis itu yang menggantikan kartu pembungkus.
 */
export default function PageHeader({
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 xl:flex-row xl:items-start ${className}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
