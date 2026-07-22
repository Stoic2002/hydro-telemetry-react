import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAccessToken,
  refreshAuthSession,
  subscribeToAuthSession,
} from '../../../api/http';
import { buildApiUrl } from '../../../api/http/url';
import {
  mapMonitoringParameterLatest,
  mapPLTALatestMonitoring,
} from '../api/http-monitoring-repository';
import {
  monitoringQueryKeys,
  usePLTALatestQuery,
  useRiverBasinLatestQuery,
} from '../api/queries';
import {
  apiMonitoringEventSchema,
  apiPLTALatestMonitoringSchema,
  apiRiverBasinLatestMonitoringSchema,
} from '../api/schemas';
import type {
  MonitoringConnectionStatus,
  MonitoringParameterLatest,
  PLTALatestMonitoring,
} from '../model';

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 8;
const STABLE_CONNECTION_MS = 10_000;

export interface UseMonitoringStreamOptions {
  scope: 'plta' | 'river-basin';
  id: string;
  enabled?: boolean;
}

export interface MonitoringStreamState {
  status: MonitoringConnectionStatus;
  reconnectAttempt: number;
  lastMessageAt: Date | null;
  error: string | null;
  reconnect: () => void;
}

function buildMonitoringWebSocketUrl(
  scope: UseMonitoringStreamOptions['scope'],
  id: string,
  accessToken: string,
): string {
  if (typeof window === 'undefined') {
    throw new Error('WebSocket monitoring hanya tersedia di browser');
  }

  const httpUrl = buildApiUrl('/api/v1/ws/monitoring');
  const url = new URL(httpUrl, window.location.origin);

  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  else throw new Error('Protokol API tidak mendukung WebSocket');

  url.searchParams.set('token', accessToken);
  url.searchParams.set(scope === 'plta' ? 'plta_id' : 'ws_id', id);

  return url.toString();
}

function parameterIdentity(parameter: MonitoringParameterLatest): string {
  return `${parameter.parameter}\u0000${parameter.station}`;
}

function mergePLTASnapshot(
  current: PLTALatestMonitoring | undefined,
  update: PLTALatestMonitoring,
): PLTALatestMonitoring {
  if (!current || current.pltaId !== update.pltaId) return update;

  const parameters = new Map(
    current.parameters.map((parameter) => [parameterIdentity(parameter), parameter]),
  );

  update.parameters.forEach((parameter) => {
    parameters.set(parameterIdentity(parameter), parameter);
  });

  return {
    pltaId: update.pltaId,
    parameters: [...parameters.values()],
  };
}

function mergeRiverBasinSnapshots(
  current: PLTALatestMonitoring[] | undefined,
  updates: PLTALatestMonitoring[],
): PLTALatestMonitoring[] {
  const snapshots = new Map(
    (current ?? []).map((snapshot) => [snapshot.pltaId, snapshot]),
  );

  updates.forEach((update) => {
    snapshots.set(
      update.pltaId,
      mergePLTASnapshot(snapshots.get(update.pltaId), update),
    );
  });

  return [...snapshots.values()];
}

function extractSnapshots(value: unknown, depth = 0): PLTALatestMonitoring[] | null {
  if (depth > 4) return null;

  const singleResult = apiPLTALatestMonitoringSchema.safeParse(value);
  if (singleResult.success) {
    return [mapPLTALatestMonitoring(singleResult.data)];
  }

  const arrayResult = apiRiverBasinLatestMonitoringSchema.safeParse(value);
  if (arrayResult.success) {
    return arrayResult.data.map(mapPLTALatestMonitoring);
  }

  const eventResult = apiMonitoringEventSchema.safeParse(value);
  if (eventResult.success) {
    const { plta_id: pltaId, ...parameter } = eventResult.data;
    return [{
      pltaId,
      parameters: [mapMonitoringParameterLatest(parameter)],
    }];
  }

  if (typeof value === 'string') {
    try {
      return extractSnapshots(JSON.parse(value), depth + 1);
    } catch {
      return null;
    }
  }

  if (typeof value !== 'object' || value === null) return null;

  for (const key of ['data', 'payload'] as const) {
    if (Object.hasOwn(value, key)) {
      const snapshots = extractSnapshots(Reflect.get(value, key), depth + 1);
      if (snapshots) return snapshots;
    }
  }

  return null;
}

async function readMessageData(data: unknown): Promise<unknown> {
  if (typeof data === 'string') return JSON.parse(data);
  if (data instanceof Blob) return JSON.parse(await data.text());
  if (data instanceof ArrayBuffer) {
    return JSON.parse(new TextDecoder().decode(data));
  }

  return data;
}

function isAuthenticationClose(event: CloseEvent): boolean {
  return event.code === 4401
    || event.code === 4403
    || (event.code === 1008 && /auth|token|unauthor/i.test(event.reason));
}

export function useMonitoringStream({
  scope,
  id,
  enabled = true,
}: UseMonitoringStreamOptions): MonitoringStreamState {
  const queryClient = useQueryClient();
  const pltaQuery = usePLTALatestQuery(id, enabled && scope === 'plta');
  const riverBasinQuery = useRiverBasinLatestQuery(
    id,
    enabled && scope === 'river-basin',
  );
  const initialSnapshotFetched = scope === 'plta'
    ? pltaQuery.isFetched
    : riverBasinQuery.isFetched;
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [status, setStatus] = useState<MonitoringConnectionStatus>('idle');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionRevision, setConnectionRevision] = useState(0);
  const queryKey = useMemo(
    () => scope === 'plta'
      ? monitoringQueryKeys.pltaLatest(id)
      : monitoringQueryKeys.riverBasinLatest(id),
    [id, scope],
  );
  const reconnect = useCallback(() => {
    setReconnectAttempt(0);
    setError(null);
    setConnectionRevision((revision) => revision + 1);
  }, []);
  useEffect(() => subscribeToAuthSession((tokens) => {
    setAccessToken(tokens?.access_token ?? null);
  }), []);

  useEffect(() => {
    if (!enabled || !id) {
      return undefined;
    }

    if (!initialSnapshotFetched) {
      return undefined;
    }

    if (!accessToken) {
      return undefined;
    }

    let socket: WebSocket | null = null;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stableConnectionTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const clearTimers = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (stableConnectionTimer) clearTimeout(stableConnectionTimer);
      reconnectTimer = null;
      stableConnectionTimer = null;
    };

    const updateCache = (snapshots: PLTALatestMonitoring[]) => {
      if (scope === 'plta') {
        const update = snapshots.find((snapshot) => snapshot.pltaId === id);
        if (!update) return;

        queryClient.setQueryData<PLTALatestMonitoring>(
          queryKey,
          (current) => mergePLTASnapshot(current, update),
        );
        return;
      }

      queryClient.setQueryData<PLTALatestMonitoring[]>(
        queryKey,
        (current) => mergeRiverBasinSnapshots(current, snapshots),
      );
    };

    const scheduleReconnect = (connect: () => void) => {
      if (disposed) return;

      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        setStatus('error');
        setError('Koneksi monitoring gagal dipulihkan setelah beberapa percobaan');
        return;
      }

      const baseDelay = Math.min(
        INITIAL_RECONNECT_DELAY_MS * (2 ** attempts),
        MAX_RECONNECT_DELAY_MS,
      );
      const jitter = 0.8 + (Math.random() * 0.4);
      const delay = Math.min(
        Math.round(baseDelay * jitter),
        MAX_RECONNECT_DELAY_MS,
      );
      attempts += 1;
      setReconnectAttempt(attempts);
      setStatus('reconnecting');
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;

      const currentToken = getAccessToken();
      if (!currentToken) {
        setStatus('error');
        setError('Sesi autentikasi tidak tersedia untuk monitoring realtime');
        return;
      }

      setStatus(attempts === 0 ? 'connecting' : 'reconnecting');

      try {
        socket = new WebSocket(buildMonitoringWebSocketUrl(scope, id, currentToken));
      } catch (connectionError) {
        setError(
          connectionError instanceof Error
            ? connectionError.message
            : 'Gagal membuat koneksi monitoring realtime',
        );
        scheduleReconnect(connect);
        return;
      }

      socket.addEventListener('open', () => {
        if (disposed) return;
        setStatus('open');
        setError(null);
        stableConnectionTimer = setTimeout(() => {
          attempts = 0;
          setReconnectAttempt(0);
        }, STABLE_CONNECTION_MS);
      });

      socket.addEventListener('message', (event) => {
        void readMessageData(event.data)
          .then(extractSnapshots)
          .then((snapshots) => {
            if (disposed) return;
            if (!snapshots) {
              setError('Pesan monitoring realtime tidak sesuai kontrak');
              return;
            }

            updateCache(snapshots);
            setLastMessageAt(new Date());
            setError(null);
          })
          .catch(() => {
            if (!disposed) {
              setError('Pesan monitoring realtime tidak dapat dibaca');
            }
          });
      });

      socket.addEventListener('error', () => {
        if (!disposed) setError('Koneksi monitoring realtime mengalami gangguan');
      });

      socket.addEventListener('close', (event) => {
        if (disposed) return;
        if (stableConnectionTimer) clearTimeout(stableConnectionTimer);
        stableConnectionTimer = null;

        if (event.code === 1000) {
          setStatus('closed');
          return;
        }

        if (isAuthenticationClose(event)) {
          void refreshAuthSession()
            .catch(() => null)
            .finally(() => scheduleReconnect(connect));
          return;
        }

        scheduleReconnect(connect);
      });
    };

    reconnectTimer = setTimeout(connect, 0);

    return () => {
      disposed = true;
      clearTimers();
      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close(1000, 'Monitoring scope changed');
      }
    };
  }, [
    accessToken,
    connectionRevision,
    enabled,
    id,
    initialSnapshotFetched,
    queryClient,
    queryKey,
    scope,
  ]);

  const hasActiveScope = enabled && Boolean(id);
  const missingAuthentication = hasActiveScope
    && initialSnapshotFetched
    && !accessToken;

  return {
    status: !hasActiveScope || !initialSnapshotFetched
      ? 'idle'
      : missingAuthentication
        ? 'error'
        : status,
    reconnectAttempt: hasActiveScope ? reconnectAttempt : 0,
    lastMessageAt,
    error: !hasActiveScope
      ? null
      : missingAuthentication
        ? 'Sesi autentikasi tidak tersedia untuk monitoring realtime'
        : error,
    reconnect,
  };
}
