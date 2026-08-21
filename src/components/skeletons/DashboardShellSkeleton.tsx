import Skeleton from '../atoms/Skeleton';
import DashboardPageSkeleton from './DashboardPageSkeleton';
import { getDashboardSkeletonVariant } from './dashboardSkeletonVariant';

/**
 * Skeleton untuk shell dashboard, dipakai sebelum layout aslinya siap dirender.
 *
 * Ukuran sidebar, header, dan padding di sini sengaja disamakan dengan
 * `DashboardLayout`. Sebelumnya tahap pertama pemuatan memakai skeleton generik
 * tanpa sidebar, sehingga seluruh layout melompat begitu shell aslinya muncul.
 *
 * Varian isi halaman ditentukan dari path yang sedang dibuka, jadi bentuk
 * shimmer pertama sudah sama dengan konten yang akan menggantikannya.
 */

interface DashboardShellSkeletonProps {
  pathname?: string;
}

function SidebarSkeleton() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border-subtle bg-surface-raised lg:flex">
      <div className="flex h-[72px] shrink-0 items-center gap-2.5 border-b border-border-subtle px-4">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-2 w-16 rounded" />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={`nav-${index}`} className="flex h-10 items-center gap-2.5 px-3">
            <Skeleton className="size-[18px] shrink-0 rounded" />
            <Skeleton className="h-3 flex-1 rounded" />
          </div>
        ))}
      </nav>

      <div className="flex h-[68px] shrink-0 items-center gap-2.5 border-t border-border-subtle px-4">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-2 w-16 rounded" />
        </div>
      </div>
    </aside>
  );
}

export default function DashboardShellSkeleton({
  pathname = typeof window === 'undefined' ? '' : window.location.pathname,
}: DashboardShellSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Memuat dashboard"
      className="flex min-h-screen min-w-0 bg-surface-base"
    >
      <SidebarSkeleton />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-raised/95 px-4 lg:hidden">
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <Skeleton className="h-3 w-32 rounded" />
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 p-3 sm:p-4 lg:p-6">
          <DashboardPageSkeleton variant={getDashboardSkeletonVariant(pathname)} />
        </main>
      </div>

      <span className="sr-only">Memuat dashboard...</span>
    </div>
  );
}
