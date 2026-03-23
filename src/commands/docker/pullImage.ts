import yargs from 'yargs';
import Docker from 'dockerode';
import { log } from '../../utils/logger';

const docker = new Docker();

export const pullImageCommand: yargs.CommandModule = {
  command: 'pull',
  describe: 'Pull a Docker image',
  builder: (yargs) => {
    return yargs
      .option('image', {
        alias: 'i',
        type: 'string',
        demandOption: true,
        description: 'Docker image to pull (e.g., ghcr.io/zaproxy/zaproxy:stable)',
      })
      .option('tag', {
        alias: 't',
        type: 'string',
        description: 'Specific tag to pull (default: latest)',
      });
  },
  handler: async (argv) => {
    const imageName = argv.image as string;
    const tag = (argv.tag as string) || 'latest';
    const fullImage = `${imageName}:${tag}`;
    
    log.info(`Pulling Docker image: ${fullImage}`);
    
    return new Promise<void>((resolve, reject) => {
      docker.pull(fullImage, (err: any, stream: NodeJS.ReadableStream) => {
        if (err) {
          log.error(`Failed to pull image: ${err.message}`);
          reject(err);
          return;
        }

        docker.modem.followProgress(stream, (err: any, output: any[]) => {
          if (err) {
            log.error(`Error during pull: ${err.message}`);
            reject(err);
            return;
          }
          
          log.success(`Successfully pulled image: ${fullImage}`);
          resolve();
        });
      });
    });
  },
};

export { docker };