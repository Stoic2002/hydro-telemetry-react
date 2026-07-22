import { readFile } from 'node:fs/promises';
import {
  parseElevationWorkbook,
  parseRTOWWorkbook,
} from '../../../src/features/uploads/parse-workbook';

const filePath = new URL('./dummy-input-ghw-2010.xlsx', import.meta.url);
const bytes = await readFile(filePath);
const workbookFile = new File([bytes], 'dummy-input-ghw-2010.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

const elevation = await parseElevationWorkbook(workbookFile);
const rtow = await parseRTOWWorkbook(workbookFile);

console.log(JSON.stringify({ elevation, rtow }, null, 2));
