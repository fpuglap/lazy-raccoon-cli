import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, statSync, readdirSync, chmodSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeConfig } from '../lib/config-writer.js';
import type { ToolDefinition } from '../lib/tools/index.js';

describe('config-writer', () => {
  let baseTmpDir: string;
  let testDir: string;
  let mockTool: ToolDefinition;

  beforeEach(() => {
    baseTmpDir = mkdtempSync(join(tmpdir(), 'lazy-config-writer-test-'));
    testDir = join(baseTmpDir, 'target');
    
    mockTool = {
      id: "test",
      label: "Test",
      getDir: () => testDir,
      files: [
        { key: "script", path: "script.sh", type: "text", label: "script.sh" }
      ]
    };
  });

  afterEach(() => {
    if (existsSync(baseTmpDir)) {
      rmSync(baseTmpDir, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform === 'win32')('should preserve file permissions when overwriting existing files', () => {
    mkdirSync(testDir, { recursive: true });
    const targetFile = join(testDir, 'script.sh');
    
    writeFileSync(targetFile, 'echo "old"');
    chmodSync(targetFile, 0o755); // executable
    
    const initialMode = statSync(targetFile).mode & 0o777;

    writeConfig(mockTool, { script: 'echo "new"' }, { dir: testDir });

    const newMode = statSync(targetFile).mode & 0o777;
    expect(newMode).toBe(initialMode);
  });

  it('should limit backups to the most recent 5', async () => {
    mkdirSync(testDir, { recursive: true });
    const targetFile = join(testDir, 'script.sh');
    writeFileSync(targetFile, 'echo "data"');

    // Create 7 backups by triggering writeConfig 7 times
    for(let i=0; i<7; i++) {
        // Sleep to ensure timestamps are different enough (if needed, though ISO string has ms)
        await new Promise(r => setTimeout(r, 10));
        writeConfig(mockTool, { script: `echo "${i}"` }, { dir: testDir });
    }

    const backups = readdirSync(baseTmpDir).filter(n => n.startsWith('target.backup.'));
    
    expect(backups.length).toBe(5);
  });
});
