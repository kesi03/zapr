import yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { log } from '../../utils/logger';

export const generatePlanCommand: yargs.CommandModule = {
  command: 'generate-plan',
  describe: 'Generate ZAP automation YAML plan using zap-cdk from a TypeScript or JavaScript file',
  builder: (yargs) => {
    return yargs
      .option('input', {
        alias: 'i',
        type: 'string',
        description: 'Path to the TypeScript/JavaScript input file using zap-cdk constructs',
        demandOption: true,
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output YAML file path (default: zap-plan.yaml)',
        default: 'zap-plan.yaml',
      })
      .option('output-dir', {
        alias: 'D',
        type: 'string',
        description: 'Output directory for the generated YAML file',
        default: '.',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Enable verbose output',
        default: false,
      });
  },
  handler: async (argv) => {
    const inputFile = argv.input as string;
    const outputFile = (argv.output as string) || 'zap-plan.yaml';
    const outputDir = (argv['output-dir'] as string) || '.';
    const verbose = argv.verbose as boolean;

    if (!inputFile) {
      log.error('Input file is required. Use --input or -i');
      process.exit(1);
    }

    if (!fs.existsSync(inputFile)) {
      log.error(`Input file not found: ${inputFile}`);
      process.exit(1);
    }

    const absoluteInputPath = path.resolve(inputFile);
    const absoluteOutputDir = path.isAbsolute(outputDir)
      ? outputDir
      : path.resolve(process.cwd(), outputDir);

    if (!fs.existsSync(absoluteOutputDir)) {
      fs.mkdirSync(absoluteOutputDir, { recursive: true });
    }

    const baseOutputName = outputFile.replace('.yaml', '').replace('.yml', '');

    log.info(`Generating ZAP automation plan from: ${inputFile}`);
    log.info(`Output will be written to: ${absoluteOutputDir}`);

    try {
      const isTypeScript = inputFile.endsWith('.ts');
      let result;

      if (isTypeScript) {
        if (verbose) {
          log.info('Using tsx to execute TypeScript file...');
        }
        result = spawnSync('npx', ['tsx', absoluteInputPath], {
          cwd: path.dirname(absoluteInputPath),
          stdio: verbose ? 'inherit' : 'pipe',
          shell: true,
        });
      } else {
        if (verbose) {
          log.info('Executing JavaScript file...');
        }
        result = spawnSync('node', [absoluteInputPath], {
          cwd: path.dirname(absoluteInputPath),
          stdio: verbose ? 'inherit' : 'pipe',
          shell: true,
        });
      }

      if (result && result.status !== 0) {
        if (!verbose && result.stderr) {
          console.error(result.stderr.toString());
        }
        log.error('Failed to generate YAML plan');
        process.exit(1);
      }

      const possiblePaths = [
        path.join(absoluteOutputDir, `${baseOutputName}.yaml`),
        path.join('.zap-automation', 'zap.yaml'),
        path.join(path.dirname(absoluteInputPath), 'zap.yaml'),
        path.join(path.dirname(absoluteInputPath), '.zap-automation', 'zap.yaml'),
      ];

      let generatedYamlPath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          generatedYamlPath = p;
          break;
        }
      }

      if (generatedYamlPath) {
        const finalPath = path.join(absoluteOutputDir, `${baseOutputName}.yaml`);
        if (generatedYamlPath !== finalPath) {
          fs.copyFileSync(generatedYamlPath, finalPath);
          fs.unlinkSync(generatedYamlPath);
        }
        log.success(`Generated: ${finalPath}`);
        if (verbose) {
          const content = fs.readFileSync(finalPath, 'utf-8');
          console.log('\n--- Generated YAML ---\n');
          console.log(content);
        }
      } else {
        log.error('Failed to generate YAML file. Check that your file calls app.synth().');
        if (verbose) {
          log.info('Searched in:');
          possiblePaths.forEach(p => log.info('  - ' + p));
          log.info('Files in output directory:');
          if (fs.existsSync(absoluteOutputDir)) {
            fs.readdirSync(absoluteOutputDir).forEach(f => console.log('  - ' + f));
          }
        }
        process.exit(1);
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      if (verbose && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  },
};