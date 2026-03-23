const { App, ZapConfig } = require('zap-cdk');

const app = new App();

const zapConfig = {
  env: {
    contexts: [
      {
        name: 'test-context',
        urls: ['https://example.com'],
        includePaths: ['https://example.com/.*'],
        excludePaths: ['https://example.com/logout.*'],
        authentication: {
          method: 'autodetect',
          parameters: {},
          verification: {
            method: 'auto'
          }
        },
        sessionManagement: {
          method: 'cookie',
          parameters: {}
        },
        technology: {
          exclude: []
        }
      }
    ],
    parameters: {
      failOnError: true,
      failOnWarning: false
    }
  },
  jobs: [
    {
      type: 'passiveScan-config',
      parameters: {
        maxAlertsPerRule: 10
      }
    },
    {
      type: 'spider',
      parameters: {
        context: 'test-context',
        maxDuration: 2,
        maxDepth: 5,
        url: 'https://example.com'
      }
    },
    {
      type: 'passiveScan-wait',
      parameters: {
        maxTime: 2
      }
    },
    {
      type: 'activeScan',
      parameters: {
        context: 'test-context',
        policy: 'Default Policy',
        maxScanDurationInMins: 5,
        url: 'https://example.com'
      }
    },
    {
      type: 'report',
      parameters: {
        template: 'traditional-html',
        reportDir: './zap-reports',
        reportFile: 'zap-report.html'
      }
    }
  ]
};

new ZapConfig(app, 'zap', { zap: zapConfig });

app.synth();