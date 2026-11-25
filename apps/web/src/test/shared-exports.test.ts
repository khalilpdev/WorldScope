import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as shared from '@worldscope/shared';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

function readFromRoot(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

/**
 * Regression guard for the blank-page incident: `@worldscope/shared` is built
 * as CommonJS and linked into Vite. A barrel with `export *` compiles to a
 * dynamic `__exportStar` loop, whose names Vite cannot expose as named imports.
 * The browser then fails on `THEME_STORAGE_KEY` before React mounts. Node's ESM
 * interop and Vitest mask the problem, so assert the build/config shape too.
 */
describe('shared package browser interoperability', () => {
  it('exports the constants consumed by the web client', () => {
    expect(shared.THEME_STORAGE_KEY).toBe('worldscope-theme');
    expect(shared.CLIENT_ID_STORAGE_KEY).toBe('worldscope-client-id');
    expect(shared.MAX_COMPARE_COUNTRIES).toBe(4);
  });

  it('uses explicit re-exports in the shared barrel', () => {
    const source = readFromRoot('packages/shared/src/index.ts');
    expect(source).not.toMatch(/export\s+\*/);
    expect(source).toContain('THEME_STORAGE_KEY');
  });

  it('emits statically detectable named exports in the CommonJS build', () => {
    const built = readFromRoot('packages/shared/dist/index.js');
    expect(built).toMatch(/Object\.defineProperty\(exports,\s*['"]THEME_STORAGE_KEY['"]/);
    expect(built).not.toMatch(/__exportStar\(require\(['"]\.\/constants['"]\)/);
  });

  it('forces Vite to pre-bundle the linked CommonJS package', () => {
    const config = readFromRoot('apps/web/vite.config.ts');
    expect(config).toMatch(
      /optimizeDeps:\s*\{[\s\S]*?include:\s*\[[\s\S]*?['"]@worldscope\/shared['"]/,
    );
  });
});
