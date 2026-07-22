import readXlsxFile, {
  type CellValue,
  type Sheet,
} from 'read-excel-file/browser';
import type {
  ParsedElevationWorkbook,
  ParsedRTOWWorkbook,
} from './model';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export class UploadTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadTemplateError';
  }
}

function validateFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new UploadTemplateError('Gunakan file Excel berformat .xlsx dari template standar.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadTemplateError('Ukuran file melebihi batas 10 MB.');
  }
}

function normalized(value: CellValue | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function findSheet(sheets: Sheet[], expectedName: string): Sheet {
  const expected = normalized(expectedName);
  const sheet = sheets.find((candidate) => normalized(candidate.sheet) === expected);

  if (!sheet) {
    throw new UploadTemplateError(`Sheet ${expectedName} tidak ditemukan. Jangan mengubah nama sheet template.`);
  }

  return sheet;
}

function parseNumberCell(
  value: CellValue | null | undefined,
  label: string,
  rowNumber: number,
  optional?: false,
): number;
function parseNumberCell(
  value: CellValue | null | undefined,
  label: string,
  rowNumber: number,
  optional: true,
): number | null;
function parseNumberCell(
  value: CellValue | null | undefined,
  label: string,
  rowNumber: number,
  optional = false,
): number | null {
  if (value === null || value === undefined || value === '') {
    if (optional) return null;
    throw new UploadTemplateError(`${label} pada baris ${rowNumber} wajib diisi.`);
  }

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const compact = value.trim().replace(/\s/g, '');
    if (/^-?\d+(?:[.,]\d+)?$/.test(compact)) {
      const parsed = Number(compact.replace(',', '.'));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  throw new UploadTemplateError(
    `${label} pada baris ${rowNumber} harus berupa angka tanpa pemisah ribuan manual.`,
  );
}

function findMetadataYear(sheet: Sheet, key: 'year' | 'tahun'): number {
  const target = normalized(key);

  for (let index = 0; index < Math.min(sheet.data.length, 10); index += 1) {
    const row = sheet.data[index];
    const labelIndex = row.findIndex((cell) => normalized(cell) === target);
    if (labelIndex < 0) continue;

    const value = parseNumberCell(row[labelIndex + 1], key, index + 1);
    if (!Number.isInteger(value) || value < MIN_YEAR || value > MAX_YEAR) {
      throw new UploadTemplateError(`${key} harus berupa tahun ${MIN_YEAR}–${MAX_YEAR}.`);
    }
    return value;
  }

  throw new UploadTemplateError(`Metadata ${key} tidak ditemukan pada 10 baris pertama.`);
}

function findHeaderRow(sheet: Sheet, headers: string[]): {
  rowIndex: number;
  columnIndexes: number[];
} {
  const expected = headers.map(normalized);

  for (let rowIndex = 0; rowIndex < Math.min(sheet.data.length, 30); rowIndex += 1) {
    const normalizedRow = sheet.data[rowIndex].map(normalized);
    const columnIndexes = expected.map((header) => normalizedRow.indexOf(header));
    if (columnIndexes.every((index) => index >= 0)) return { rowIndex, columnIndexes };
  }

  throw new UploadTemplateError(`Header wajib tidak ditemukan: ${headers.join(', ')}.`);
}

function rowHasValue(row: Array<CellValue | null>, indexes: number[]): boolean {
  return indexes.some((index) => {
    const value = row[index];
    return value !== null && value !== undefined && value !== '';
  });
}

function dateToISO(value: CellValue | null | undefined, rowNumber: number): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new UploadTemplateError(`tanggal pada baris ${rowNumber} harus berformat YYYY-MM-DD.`);
  }

  const date = value.trim();
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new UploadTemplateError(`tanggal ${date} pada baris ${rowNumber} tidak valid.`);
  }

  return date;
}

async function readWorkbook(file: File): Promise<Sheet[]> {
  validateFile(file);

  try {
    return await readXlsxFile(file);
  } catch (error) {
    throw new UploadTemplateError(
      error instanceof Error && error.message
        ? `File Excel tidak dapat dibaca: ${error.message}`
        : 'File Excel tidak dapat dibaca.',
    );
  }
}

export async function parseElevationWorkbook(file: File): Promise<ParsedElevationWorkbook> {
  const sheet = findSheet(await readWorkbook(file), 'ELEVATION_VOLUME');
  const year = findMetadataYear(sheet, 'year');
  const { rowIndex, columnIndexes } = findHeaderRow(sheet, [
    'elevation',
    'volume',
    'area',
  ]);
  const [elevationIndex, volumeIndex, areaIndex] = columnIndexes;
  const seenElevations = new Set<number>();
  const points = sheet.data.slice(rowIndex + 1).flatMap((row, relativeIndex) => {
    if (!rowHasValue(row, columnIndexes)) return [];

    const rowNumber = rowIndex + relativeIndex + 2;
    const elevation = parseNumberCell(row[elevationIndex], 'elevation', rowNumber);
    const volume = parseNumberCell(row[volumeIndex], 'volume', rowNumber);
    const area = parseNumberCell(row[areaIndex], 'area', rowNumber, true) ?? 0;

    if (elevation < 0 || volume < 0 || area < 0) {
      throw new UploadTemplateError(`Nilai pada baris ${rowNumber} tidak boleh negatif.`);
    }
    if (seenElevations.has(elevation)) {
      throw new UploadTemplateError(`elevation ${elevation} duplikat pada baris ${rowNumber}.`);
    }
    seenElevations.add(elevation);

    return [{ elevation, volume, area }];
  });

  if (points.length === 0) {
    throw new UploadTemplateError('Sheet ELEVATION_VOLUME belum berisi data.');
  }

  points.sort((left, right) => left.elevation - right.elevation);

  return {
    year,
    minElevation: points[0].elevation,
    maxElevation: points[points.length - 1].elevation,
    points,
  };
}

export async function parseRTOWWorkbook(file: File): Promise<ParsedRTOWWorkbook> {
  const sheet = findSheet(await readWorkbook(file), 'RTOW');
  const tahun = findMetadataYear(sheet, 'tahun');
  const { rowIndex, columnIndexes } = findHeaderRow(sheet, [
    'tanggal',
    'target_elevasi',
  ]);
  const [dateIndex, targetIndex] = columnIndexes;
  const seenDates = new Set<string>();
  const entries = sheet.data.slice(rowIndex + 1).flatMap((row, relativeIndex) => {
    if (!rowHasValue(row, columnIndexes)) return [];

    const rowNumber = rowIndex + relativeIndex + 2;
    const tanggal = dateToISO(row[dateIndex], rowNumber);
    const targetElevasi = parseNumberCell(row[targetIndex], 'target_elevasi', rowNumber);

    if (!tanggal.startsWith(`${tahun}-`)) {
      throw new UploadTemplateError(`tanggal ${tanggal} tidak berada pada tahun ${tahun}.`);
    }
    if (targetElevasi < 0) {
      throw new UploadTemplateError(`target_elevasi pada baris ${rowNumber} tidak boleh negatif.`);
    }
    if (seenDates.has(tanggal)) {
      throw new UploadTemplateError(`tanggal ${tanggal} duplikat pada baris ${rowNumber}.`);
    }
    seenDates.add(tanggal);

    return [{ tanggal, targetElevasi }];
  });

  if (entries.length === 0) {
    throw new UploadTemplateError('Sheet RTOW belum berisi data.');
  }

  entries.sort((left, right) => left.tanggal.localeCompare(right.tanggal));
  return { tahun, entries };
}
