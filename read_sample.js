const xlsx = require('xlsx');
const filename = 'D:\\NASA HERC 2026\\exemption_agent\\sample sheet.xlsx';
const workbook = xlsx.readFile(filename);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 5), null, 2));
