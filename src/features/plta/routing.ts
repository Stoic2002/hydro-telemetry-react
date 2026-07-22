import { useParams } from 'react-router-dom';

export type PLTADashboardPage =
  | 'overview'
  | 'telemetering'
  | 'forecasting'
  | 'trends'
  | 'laporan'
  | 'input-ghw'
  | 'data-input-operator'
  | 'user-management'
  | 'account';

export function isValidPLTAId(pltaId: string | undefined): pltaId is string {
  return Boolean(
    pltaId
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pltaId),
  );
}

export function getPLTADashboardPath(
  pltaId: string,
  page: PLTADashboardPage,
): string {
  return `/dashboard/plta/${encodeURIComponent(pltaId)}/${page}`;
}

export function getUnscopedDashboardPath(page: PLTADashboardPage): string {
  return `/dashboard/${page}`;
}

export function useActivePLTAId(): string {
  const { pltaId } = useParams<{ pltaId: string }>();

  if (!isValidPLTAId(pltaId)) {
    throw new Error('ID PLTA pada route tidak valid');
  }

  return pltaId;
}
