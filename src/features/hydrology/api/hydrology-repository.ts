import type {
  MonthlyHydrology,
  MonthlyHydrologyImageKind,
  PLTAHydrologyDashboard,
  UpsertMonthlyHydrologyInput,
  UploadMonthlyHydrologyImageInput,
} from '../model';

export interface HydrologyRequestOptions {
  signal?: AbortSignal;
}

export interface HydrologyRepository {
  getPLTADashboard(
    pltaId: string,
    options?: HydrologyRequestOptions,
  ): Promise<PLTAHydrologyDashboard>;
  listMonthly(
    pltaId: string,
    year: number,
    options?: HydrologyRequestOptions,
  ): Promise<MonthlyHydrology[]>;
  getMonthlyImage(
    pltaId: string,
    year: number,
    month: number,
    kind: MonthlyHydrologyImageKind,
    options?: HydrologyRequestOptions,
  ): Promise<Blob>;
  upsertMonthly(input: UpsertMonthlyHydrologyInput): Promise<MonthlyHydrology>;
  uploadMonthlyImage(
    input: UploadMonthlyHydrologyImageInput,
  ): Promise<MonthlyHydrology>;
}
