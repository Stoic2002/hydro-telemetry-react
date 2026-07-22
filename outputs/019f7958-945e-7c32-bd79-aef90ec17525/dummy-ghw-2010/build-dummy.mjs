import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workDir = new URL('.', import.meta.url).pathname;
const templatePath = new URL('../../../public/templates/template-upload-plta.xlsx', import.meta.url).pathname;

const input = await FileBlob.load(templatePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 8_000,
  tableMaxRows: 12,
  tableMaxCols: 8,
  tableMaxCellChars: 100,
});
console.log(overview.ndjson);

for (const sheetName of ['ELEVATION_VOLUME', 'RTOW']) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: 'all',
    scale: 1,
    format: 'png',
  });
  await fs.writeFile(
    `${workDir}/before-${sheetName.toLowerCase()}.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const elevationSheet = workbook.worksheets.getItem('ELEVATION_VOLUME');
elevationSheet.getRange('B3').values = [[2010]];
elevationSheet.getRange('A6:C9').values = [
  [190, 10_000_000, 1_250_000],
  [200, 24_000_000, 1_800_000],
  [210, 43_000_000, 2_450_000],
  [220, 67_000_000, 3_200_000],
];
elevationSheet.getRange('A6:C9').format.numberFormat = '0.00';

const rtowSheet = workbook.worksheets.getItem('RTOW');
rtowSheet.getRange('B3').values = [[2010]];
rtowSheet.getRange('A6:B17').values = Array.from({ length: 12 }, (_, monthIndex) => [
  new Date(Date.UTC(2010, monthIndex, 1)),
  215 + monthIndex * 0.25,
]);
rtowSheet.getRange('A6:A17').format.numberFormat = 'yyyy-mm-dd';
rtowSheet.getRange('B6:B17').format.numberFormat = '0.00';

const finalInspection = await workbook.inspect({
  kind: 'table',
  maxChars: 8_000,
  tableMaxRows: 20,
  tableMaxCols: 5,
  tableMaxCellChars: 100,
});
console.log(finalInspection.ndjson);

const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
});
console.log(formulaErrors.ndjson);

for (const sheetName of ['ELEVATION_VOLUME', 'RTOW']) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: 'all',
    scale: 1,
    format: 'png',
  });
  await fs.writeFile(
    `${workDir}/after-${sheetName.toLowerCase()}.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${workDir}/dummy-input-ghw-2010.xlsx`);
