import * as path from 'path';
import * as fs from 'fs';
import { setLogFilePath } from './logger';

const DEFAULT_WORKSPACE = './zap-results';

export function getWorkspace(): string {
  return process.env.ZAPSTER_WORKSPACE || DEFAULT_WORKSPACE;
}

export function getWorkspacePath(filename: string): string {
  const workspace = getWorkspace();
  return path.join(workspace, filename);
}

export function ensureWorkspace(): string {
  const workspace = getWorkspace();
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
  }
  return workspace;
}

export function initLoggerWithWorkspace(): string {
  const workspace = ensureWorkspace();
  setLogFilePath(workspace);
  return workspace;
}
