import Skeleton from '../atoms/Skeleton';

interface ResourceTableSkeletonProps {
  columns: number;
  rows?: number;
}

export default function ResourceTableSkeleton({
  columns,
  rows = 10,
}: ResourceTableSkeletonProps) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={`resource-row-skeleton-${rowIndex}`} aria-hidden="true" className="border-b border-surface-overlay last:border-b-0">
      {Array.from({ length: columns }, (__, columnIndex) => (
        <td key={`resource-cell-skeleton-${rowIndex}-${columnIndex}`} className="px-3.5 py-2.5">
          <Skeleton
            className={`h-[11px] rounded-[4px] ${
              (rowIndex + columnIndex) % 3 === 0
                ? 'w-28'
                : (rowIndex + columnIndex) % 3 === 1
                  ? 'w-20'
                  : 'w-16'
            }`}
          />
        </td>
      ))}
    </tr>
  ));
}
