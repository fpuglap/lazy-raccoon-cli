import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, statSync, readdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { writeConfig } from '../lib/config-writer.js';
import type { ToolDefinition } from '../lib/tools/index.js';

describe('config-writer', () => {
  const testDir = join(process.cwd(), 'tmp-test-dir');
  const mockTool: ToolDefinition = {
    id: "test",
    label: "Test",
    getDir: () => testDir,
    files: [
      { key: "script", path: "script.sh", type: "text", label: "script.sh" }
    ]
  };

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    
    // Clean up parent dir backups too
    const parent = process.cwd();
    const backups = readdirSync(parent).filter(n => n.startsWith('tmp-test-dir.backup.'));
    for (const b of backups) {
      rmSync(join(parent, b), { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    const parent = process.cwd();
    const backups = readdirSync(parent).filter(n => n.startsWith('tmp-test-dir.backup.'));
    for (const b of backups) {
      rmSync(join(parent, b), { recursive: true, force: true });
    }
  });

  it('should preserve file permissions when overwriting existing files', () => {
    mkdirSync(testDir, { recursive: true });
    const targetFile = join(testDir, 'script.sh');
    
    writeFileSync(targetFile, 'echo "old"');
    chmodSync(targetFile, 0o755); // executable
    
    const initialMode = statSync(targetFile).mode;

    writeConfig(mockTool, { script: 'echo "new"' }, { dir: testDir });

    const newMode = statSync(targetFile).mode;
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

    const parent = process.cwd();
    const backups = readdirSync(parent).filter(n => n.startsWith('tmp-test-dir.backup.'));
    
    expect(backups.length).toBe(5);
  });
});
