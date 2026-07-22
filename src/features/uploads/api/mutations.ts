import { useMutation } from '@tanstack/react-query';
import type { CreateElevationInput, CreateRTOWInput } from '../model';
import { uploadsRepository } from './repository';

export function useCreateElevationMutation() {
  return useMutation({
    mutationFn: (input: CreateElevationInput) => uploadsRepository.createElevation(input),
  });
}

export function useCreateRTOWMutation() {
  return useMutation({
    mutationFn: (input: CreateRTOWInput) => uploadsRepository.createRTOW(input),
  });
}
