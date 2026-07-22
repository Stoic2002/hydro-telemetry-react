import Skeleton from '../atoms/Skeleton';

interface AppShellSkeletonProps {
  embedded?: boolean;
}

export default function AppShellSkeleton({ embedded = false }: AppShellSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Memuat konten aplikasi"
      className={`flex bg-surface-base ${embedded ? 'min-h-[420px] w-full' : 'min-h-screen'}`}
    >
      <main className={`flex flex-1 flex-col gap-6 ${embedded ? 'py-1' : 'p-6'}`}>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-3 w-72 max-w-[70vw] rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="min-h-[360px] flex-1 rounded-2xl" />
      </main>
      <span className="sr-only">Memuat konten aplikasi...</span>
    </div>
  );
}
