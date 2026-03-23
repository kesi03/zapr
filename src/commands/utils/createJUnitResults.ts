import yargs from 'yargs';
import * as fs from 'fs';
import { ZapClient } from '../../zap/ZapClient';
import { Alert } from '../../types';
import { initLoggerWithWorkspace, getWorkspacePath } from '../../utils/workspace';
import { log } from '../../utils/logger';

function generateJUnitXml(alerts: Alert[], title: string): string {
  const timestamp = new Date().toISOString();
  
  const testCases = alerts.map((alert) => {
    const className = `zap.${alert.risk.toLowerCase()}`;
    const isFailure = alert.risk === 'High' || alert.risk === 'Medium';
    
    return `
    <testcase name="${escapeXml(alert.alert)}" classname="${className}" time="0">
      ${isFailure ? `
      <failure message="${escapeXml(alert.alert)} on ${escapeXml(alert.url)}" type="security">
        <![CDATA[
Plugin ID: ${alert.pluginid}
Risk: ${alert.risk}
Confidence: ${alert.confidence}
URL: ${alert.url}
Parameter: ${alert.param}
Solution: ${alert.solution || 'N/A'}
        ]]>
      </failure>` : `
      <system-out><![CDATA[Passed - Risk: ${alert.risk}]]></system-out>`}
    </testcase>`;
  }).join('');

  const failures = alerts.filter(a => a.risk === 'High' || a.risk === 'Medium').length;
  const passes = alerts.length - failures;

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="${escapeXml(title)}" tests="${alerts.length}" failures="${failures}" errors="0" skipped="0" timestamp="${timestamp}">
  <properties>
    <property name="zap.passed" value="${passes}"/>
    <property name="zap.failed" value="${failures}"/>
    <property name="zap.pass_rate" value="${((passes / alerts.length) * 100).toFixed(2)}%"/>
  </properties>
${testCases}
</testsuite>`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const createJUnitResultsCommand: yargs.CommandModule = {
  command: 'create-junit-results',
  describe: 'Generate JUnit test results from ZAP alerts',
  builder: (yargs) => {
    return yargs
      .option('workspace', {
        alias: 'w',
        type: 'string',
        description: 'Workspace directory (default: ZAPR_WORKSPACE env)',
      })
      .option('name', {
        alias: 'n',
        type: 'string',
        demandOption: true,
        description: 'Output filename for JUnit XML',
      })
      .option('title', {
        alias: 't',
        type: 'string',
        default: 'ZAP Security Scan',
        description: 'Test suite title',
      })
      .option('base-url', {
        type: 'string',
        description: 'Filter alerts by base URL',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    log.info('Generating JUnit results...');

    try {
      const alertsResponse = await zap.alerts.getAlerts(argv.baseUrl as string | undefined);
      const alerts = alertsResponse.alerts;

      log.info(`Found ${alerts.length} alerts`);

      const junitXml = generateJUnitXml(alerts, (argv.title as string) || 'ZAP Security Scan');

      const outputPath = getWorkspacePath(argv.name as string);
      fs.writeFileSync(outputPath, junitXml, 'utf-8');

      const failures = alerts.filter((a: Alert) => a.risk === 'High' || a.risk === 'Medium').length;
      const passes = alerts.length - failures;
      const passRate = ((passes / alerts.length) * 100).toFixed(2);

      log.success(`JUnit results saved to: ${outputPath}`);
      log.info(`Test cases: ${alerts.length}`);
      log.info(`Passed: ${passes} (${passRate}%)`);
      log.info(`Failed: ${failures}`);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};