import winston from 'winston';
import * as path from 'node:path';

const logLevel = process.env.DEBUG === 'true' ? 'debug' : 'info';

let logFilePath: string = 'debug.log';
let fileTransport: winston.transport | null = null;

const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple()
);

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: logFilePath, 
      level: 'debug',
      format: customFormat,
      options: { flags: 'a' }
    }),
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
});

export function setLogFilePath(outputPath: string): void {
  const dir = path.dirname(outputPath);
  logFilePath = path.join(dir, 'zapster.log');
  
  if (fileTransport) {
    logger.remove(fileTransport);
  }
  
  fileTransport = new winston.transports.File({
    filename: logFilePath,
    level: 'debug',
    format: customFormat,
    options: { flags: 'a' }
  });
  
  logger.add(fileTransport);
}

export function setDebug(enabled: boolean): void {
  logger.level = enabled ? 'debug' : 'info';
}

export const log = {
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  success: (message: string, ...args: any[]) => logger.info(`✓ ${message}`, ...args),
};
