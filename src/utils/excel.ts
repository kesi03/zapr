import * as XLSX from 'xlsx';
import * as fs from 'fs';

export interface AlertRow {
  alert: string;
  risk: string;
  confidence: string;
  url: string;
  param: string;
  solution?: string;
  desc?: string;
  pluginId?: string;
  cweId?: string;
  wascId?: string;
}

export function createExcelFromAlerts(alerts: any[], outputPath: string): void {
  const workbook = XLSX.utils.book_new();

  const highCount = alerts.filter((a: any) => a.risk === 'High').length;
  const mediumCount = alerts.filter((a: any) => a.risk === 'Medium').length;
  const lowCount = alerts.filter((a: any) => a.risk === 'Low').length;
  const infoCount = alerts.filter((a: any) => a.risk === 'Informational').length;
  const failCount = highCount + mediumCount;
  const passCount = lowCount + infoCount;

  const summaryData = [
    ['ZAP Security Scan Report'],
    ['Generated', new Date().toISOString()],
    [],
    ['Test Results Summary'],
    ['', 'Count', 'Status'],
    ['Passed', passCount, 'PASS'],
    ['Failed', failCount, 'FAIL'],
    [],
    ['Alert Summary by Risk'],
    ['Risk Level', 'Count', 'Result'],
    ['High', highCount, highCount > 0 ? 'FAIL' : 'PASS'],
    ['Medium', mediumCount, mediumCount > 0 ? 'FAIL' : 'PASS'],
    ['Low', lowCount, 'PASS'],
    ['Informational', infoCount, 'PASS'],
    ['Total', alerts.length, failCount > 0 ? 'FAIL' : 'PASS'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const alertRows: AlertRow[] = alerts.map((alert) => ({
    alert: alert.alert || '',
    risk: alert.risk || '',
    confidence: alert.confidence || '',
    url: alert.url || '',
    param: alert.param || '',
    solution: alert.solution || '',
    desc: alert.desc || '',
    pluginId: alert.pluginid || '',
    cweId: alert.cweid || '',
    wascId: alert.wascid || '',
  }));

  const alertHeaders = [
    'Alert',
    'Risk',
    'Confidence',
    'URL',
    'Parameter',
    'Solution',
    'Description',
    'Plugin ID',
    'CWE ID',
    'WASC ID',
  ];

  const alertData = [
    alertHeaders,
    ...alertRows.map((row) => [
      row.alert,
      row.risk,
      row.confidence,
      row.url,
      row.param,
      row.solution,
      row.desc,
      row.pluginId,
      row.cweId,
      row.wascId,
    ]),
  ];

  const alertsSheet = XLSX.utils.aoa_to_sheet(alertData);

  const colWidths = [
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
    { wch: 60 },
    { wch: 25 },
    { wch: 40 },
    { wch: 50 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  alertsSheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, alertsSheet, 'All Alerts');

  const highAlerts = alerts.filter((a: any) => a.risk === 'High');
  if (highAlerts.length > 0) {
    const highSheet = XLSX.utils.aoa_to_sheet([
      alertHeaders,
      ...highAlerts.map((alert) => [
        alert.alert || '',
        alert.risk || '',
        alert.confidence || '',
        alert.url || '',
        alert.param || '',
        alert.solution || '',
        alert.desc || '',
        alert.pluginid || '',
        alert.cweid || '',
        alert.wascid || '',
      ]),
    ]);
    highSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, highSheet, 'FAIL - High Risk');
  }

  const mediumAlerts = alerts.filter((a: any) => a.risk === 'Medium');
  if (mediumAlerts.length > 0) {
    const mediumSheet = XLSX.utils.aoa_to_sheet([
      alertHeaders,
      ...mediumAlerts.map((alert) => [
        alert.alert || '',
        alert.risk || '',
        alert.confidence || '',
        alert.url || '',
        alert.param || '',
        alert.solution || '',
        alert.desc || '',
        alert.pluginid || '',
        alert.cweid || '',
        alert.wascid || '',
      ]),
    ]);
    mediumSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, mediumSheet, 'FAIL - Medium Risk');
  }

  const lowAlerts = alerts.filter((a: any) => a.risk === 'Low');
  if (lowAlerts.length > 0) {
    const lowSheet = XLSX.utils.aoa_to_sheet([
      alertHeaders,
      ...lowAlerts.map((alert) => [
        alert.alert || '',
        alert.risk || '',
        alert.confidence || '',
        alert.url || '',
        alert.param || '',
        alert.solution || '',
        alert.desc || '',
        alert.pluginid || '',
        alert.cweid || '',
        alert.wascid || '',
      ]),
    ]);
    lowSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, lowSheet, 'PASS - Low Risk');
  }

  const infoAlerts = alerts.filter((a: any) => a.risk === 'Informational');
  if (infoAlerts.length > 0) {
    const infoSheet = XLSX.utils.aoa_to_sheet([
      alertHeaders,
      ...infoAlerts.map((alert) => [
        alert.alert || '',
        alert.risk || '',
        alert.confidence || '',
        alert.url || '',
        alert.param || '',
        alert.solution || '',
        alert.desc || '',
        alert.pluginid || '',
        alert.cweid || '',
        alert.wascid || '',
      ]),
    ]);
    infoSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'PASS - Informational');
  }

  XLSX.writeFile(workbook, outputPath);
}

export function createExcelFromJson(jsonPath: string, outputPath: string): void {
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const alerts = JSON.parse(jsonContent);
  createExcelFromAlerts(alerts, outputPath);
}
