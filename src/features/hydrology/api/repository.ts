import { httpHydrologyRepository } from './http-hydrology-repository';
import type { HydrologyRepository } from './hydrology-repository';

export const hydrologyRepository: HydrologyRepository = httpHydrologyRepository;
