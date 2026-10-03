import { afterEach, describe, expect, it } from 'vite-plus/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const toolRoot = path.resolve(import.meta.dirname, '../..');
const temporaryDirectories: Array<string> = [];

const runGit = (directory: string, arguments_: ReadonlyArray<string>) =>
  execFileSync('git', arguments_, {
    cwd: directory,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const createRepository = () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'diff-check-cli-'));
  temporaryDirectories.push(directory);
  runGit(directory, ['init', '-b', 'main']);
  runGit(directory, ['config', 'user.email', 'fixture@example.test']);
  runGit(directory, ['config', 'user.name', 'Fixture']);

  return directory;
};

const writeConfig = (directory: string) => {
  const configPath = path.join(directory, 'diff-check.config.json');
  writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        baseRef: 'HEAD',
        changedFileRules: [],
        excludePathPrefixes: [],
        oxlintConfigPath: path.join(toolRoot, 'diff-check.oxlintrc.json'),
        sourceExtensions: ['.ts'],
      },
      null,
      2,
    )}\n`,
  );

  return configPath;
};

const runCli = ({
  configPath,
  directory,
}: {
  configPath: string;
  directory: string;
}) =>
  spawnSync(
    process.execPath,
    [
      path.join(toolRoot, 'src/main.ts'),
      '--config',
      configPath,
    ],
    {
      cwd: directory,
      encoding: 'utf8',
    },
  );

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('diff-check CLI', () => {
  it('reports both shipped rules only for an added line', () => {
    const directory = createRepository();
    const sourcePath = path.join(directory, 'example.ts');
    writeFileSync(sourcePath, 'export const initial = 1;\n');
    runGit(directory, ['add', 'example.ts']);
    runGit(directory, ['commit', '-m', 'initial']);
    writeFileSync(
      sourcePath,
      'export const initial = 1;\nlet compute = (): number => 1;\n',
    );

    const result = runCli({
      configPath: writeConfig(directory),
      directory,
    });

    expect(result.status, result.stderr).toBe(1);
    expect(result.stdout).toContain('diff-check/no-let');
    expect(result.stdout).toContain(
      'diff-check/no-explicit-function-return-type',
    );
    expect(result.stdout).toContain('example.ts:2');
    expect(result.stderr).toBe('');
  });

  it('ignores a deleted TypeScript file for added-line linting', () => {
    const directory = createRepository();
    const sourcePath = path.join(directory, 'removed.ts');
    writeFileSync(sourcePath, 'let existing = (): number => 1;\n');
    runGit(directory, ['add', 'removed.ts']);
    runGit(directory, ['commit', '-m', 'initial']);
    rmSync(sourcePath);

    const result = runCli({
      configPath: writeConfig(directory),
      directory,
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('No violations found.');
    expect(result.stderr).toBe('');
  });
});
