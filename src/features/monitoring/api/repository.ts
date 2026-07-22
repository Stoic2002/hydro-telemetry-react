import { httpMonitoringRepository } from './http-monitoring-repository';
import type { MonitoringRepository } from './monitoring-repository';

export const monitoringRepository: MonitoringRepository = httpMonitoringRepository;
