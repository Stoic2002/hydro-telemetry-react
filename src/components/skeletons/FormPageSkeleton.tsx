import Skeleton from '../atoms/Skeleton';

export default function FormPageSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <section role="status" aria-label="Memuat formulir" className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-44 rounded-md" />
          <Skeleton className="h-2.5 w-64 max-w-[60vw] rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: fields }, (_, index) => (
          <div key={`form-field-skeleton-${index}`} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Skeleton className="h-10 w-20 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <span className="sr-only">Memuat formulir...</span>
    </section>
  );
}
