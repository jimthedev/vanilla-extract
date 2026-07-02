import { describe, expect, it } from 'vitest';
import type { Plugin } from 'vite';

/**
 * Helper to create a minimal mock plugin context for testing transform hooks.
 * This doesn't fully replicate Vite's runtime but allows us to call transform.
 */
function createMockPluginContext() {
  return {
    meta: { watchMode: false },
    moduleIds: [],
    getModuleIds: () => [][Symbol.iterator](),
    getModuleInfo: () => null,
    parse: () => ({}),
    resolve: async () => null,
    load: async () => ({ code: '' }),
    addWatchFile: () => {},
    emitFile: () => '',
    setAssetSource: () => {},
    getFileName: () => '',
    error: () => {},
    warn: () => {},
    getCombinedSourcemap: () => ({ mappings: '' }),
  };
}

describe('vanillaExtractPlugin fileExtension option', () => {
  /**
   * Test that the Options interface includes fileExtension.
   * This test will fail at compile time if fileExtension is not in the type.
   */
  it('accepts fileExtension option in plugin options type', async () => {
    const { vanillaExtractPlugin } = await import('./index');

    // This should compile without error when fileExtension is added to Options
    const plugins = vanillaExtractPlugin({
      fileExtension: '.css.ts',
    });

    expect(plugins).toBeDefined();
    expect(Array.isArray(plugins)).toBe(true);
  });

  /**
   * Test that transform returns null for .css.ts files when fileExtension is '.ve'
   */
  it('does NOT process .css.ts files when fileExtension is set to .ve', async () => {
    const { vanillaExtractPlugin } = await import('./index');

    const plugins = vanillaExtractPlugin({
      fileExtension: '.ve',
    });

    const mainPlugin = plugins.find(
      (p): p is Plugin => p.name === 'vite-plugin-vanilla-extract',
    );
    expect(mainPlugin).toBeDefined();
    expect(mainPlugin?.transform).toBeDefined();

    // Simulate calling transform with a .css.ts file
    // When fileExtension is '.ve', this should return null (not processed)
    const transformFn = mainPlugin!.transform as Function;
    const mockContext = createMockPluginContext();

    const result = await transformFn.call(
      mockContext,
      'import { style } from "@vanilla-extract/css";',
      '/project/src/styles.css.ts',
    );

    // This assertion will FAIL until fileExtension is implemented
    // because currently the plugin WILL try to process .css.ts files
    expect(result).toBeNull();
  });

  /**
   * Test that transform DOES process .ve.ts files when fileExtension is '.ve'
   */
  it('processes .ve.ts files when fileExtension is set to .ve', async () => {
    const { vanillaExtractPlugin } = await import('./index');

    const plugins = vanillaExtractPlugin({
      fileExtension: '.ve',
    });

    const mainPlugin = plugins.find(
      (p): p is Plugin => p.name === 'vite-plugin-vanilla-extract',
    );
    expect(mainPlugin).toBeDefined();

    const transformFn = mainPlugin!.transform as Function;
    const mockContext = createMockPluginContext();

    // The transform should attempt to process .ve.ts files (will throw because no compiler,
    // but the key is it doesn't return null early like it would for non-matching files)
    let didAttemptTransform = false;
    try {
      await transformFn.call(
        mockContext,
        'import { style } from "@vanilla-extract/css";',
        '/project/src/styles.ve.ts',
      );
    } catch {
      // An error means the transform was attempted (compiler not set up)
      didAttemptTransform = true;
    }

    expect(didAttemptTransform).toBe(true);
  });

  /**
   * Test that default behavior (no fileExtension) still processes .css.ts files
   */
  it('processes .css.ts files by default when fileExtension is not specified', async () => {
    const { vanillaExtractPlugin } = await import('./index');

    const plugins = vanillaExtractPlugin({});

    const mainPlugin = plugins.find(
      (p): p is Plugin => p.name === 'vite-plugin-vanilla-extract',
    );
    expect(mainPlugin).toBeDefined();

    const transformFn = mainPlugin!.transform as Function;
    const mockContext = createMockPluginContext();

    // Default behavior should process .css.ts files
    // (may throw due to missing compiler, but should not return null immediately)
    let didAttemptTransform = false;
    try {
      const result = await transformFn.call(
        mockContext,
        'import { style } from "@vanilla-extract/css";',
        '/project/src/styles.css.ts',
      );
      // If we get here without throwing, check the result
      didAttemptTransform = result !== null;
    } catch {
      // An error means the transform was attempted (compiler not set up)
      didAttemptTransform = true;
    }

    expect(didAttemptTransform).toBe(true);
  });

  /**
   * Test that multiple extensions can be specified
   */
  it('supports array of file extensions', async () => {
    const { vanillaExtractPlugin } = await import('./index');

    const plugins = vanillaExtractPlugin({
      fileExtension: ['.ve', '.styles'],
    });

    const mainPlugin = plugins.find(
      (p): p is Plugin => p.name === 'vite-plugin-vanilla-extract',
    );
    expect(mainPlugin).toBeDefined();

    const transformFn = mainPlugin!.transform as Function;
    const mockContext = createMockPluginContext();

    // All specified extensions should be processed (will throw due to no compiler, but won't return null)
    let didAttemptTransform = false;
    try {
      await transformFn.call(
        mockContext,
        'export const x = 1;',
        '/project/src/styles.ve.ts',
      );
    } catch {
      // Error means transform was attempted (no compiler set up)
      didAttemptTransform = true;
    }

    expect(didAttemptTransform).toBe(true);
  });

  /**
   * Test fileExtension works with all supported JS/TS variants
   */
  it('handles fileExtension with various JS/TS extensions', async () => {
    const { vanillaExtractPlugin } = await import('./index');

    // When setting fileExtension: '.ve', it should match .ve.ts, .ve.tsx, .ve.js, .ve.jsx, etc.
    const plugins = vanillaExtractPlugin({
      fileExtension: '.ve',
    });

    const mainPlugin = plugins.find(
      (p): p is Plugin => p.name === 'vite-plugin-vanilla-extract',
    );
    expect(mainPlugin).toBeDefined();

    const transformFn = mainPlugin!.transform as Function;
    const mockContext = createMockPluginContext();

    // Should process .ve.ts (throws because no compiler, but that means it tried)
    let tsAttempted = false;
    try {
      await transformFn.call(
        mockContext,
        'export const x = 1;',
        '/project/src/styles.ve.ts',
      );
    } catch {
      tsAttempted = true;
    }
    expect(tsAttempted).toBe(true);

    // Should process .ve.tsx
    let tsxAttempted = false;
    try {
      await transformFn.call(
        mockContext,
        'export const x = 1;',
        '/project/src/styles.ve.tsx',
      );
    } catch {
      tsxAttempted = true;
    }
    expect(tsxAttempted).toBe(true);
  });
});
