import type { PLTALatestMonitoring } from '../model';

export interface MonitoringRequestOptions {
  signal?: AbortSignal;
}

export interface MonitoringRepository {
  getLatestByPLTA(
    pltaId: string,
    options?: MonitoringRequestOptions,
  ): Promise<PLTALatestMonitoring>;
  getLatestByRiverBasin(
    wsId: string,
    options?: MonitoringRequestOptions,
  ): Promise<PLTALatestMonitoring[]>;
}
