import { App, ZapConfig } from 'zap-cdk';

const app = new App();

const zapConfig = {
  env: {
    contexts: [
      {
        name: 'test-context-ts',
        urls: ['https://example.com/ts'],
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
      type: 'spider',
      parameters: {
        context: 'test-context-ts',
        maxDuration: 2,
        maxDepth: 5,
        url: 'https://example.com/ts'
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