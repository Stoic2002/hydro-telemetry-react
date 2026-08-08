import { httpTrendsRepository } from './http-trends-repository';
import type { TrendsRepository } from './trends-repository';

export const trendsRepository: TrendsRepository = httpTrendsRepository;
