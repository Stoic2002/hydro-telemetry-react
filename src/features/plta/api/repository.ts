import { httpPltaRepository } from './http-plta-repository';
import type { PLTARepository } from './plta-repository';

export const pltaRepository: PLTARepository = httpPltaRepository;
