import { httpReportsRepository } from './http-reports-repository';
import type { ReportsRepository } from './reports-repository';

export const reportsRepository: ReportsRepository = httpReportsRepository;
