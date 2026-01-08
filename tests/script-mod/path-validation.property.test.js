/**
 * Property-Based Tests for ScriptMod Script Path Validation
 * 
 * **Feature: vertex-install-script, Property 5: Script Path Validation**
 * **Validates: Requirements 5.3**
 * 
 * Property: For any script path provided by the user, the Script_Task SHALL
 * correctly identify whether the path exists on the filesystem and return
 * an appropriate validation result.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const fc = require('fast-check');

// Mock logger to prevent console output during tests
jest.mock('../../app/libs/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock node-cron to prevent actual scheduling
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn()
  }))
}));

// Initialize global.runningScript before requiring ScriptMod
global.runningScript = {};

const ScriptMod = require('../../app/model/ScriptMod');

// Helper to create a temporary test file
function createTestFile(content = '#!/bin/bash\necho "test"') {
  const testDir = path.join(os.tmpdir(), `vertex-path-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  const filePath = path.join(testDir, 'test-script.sh');
  fs.writeFileSync(filePath, content);
  fs.chmodSync(filePath, '755');
  return { testDir, filePath };
}

// Helper to create a temporary directory (not a file)
function createTestDir() {
  const testDir = path.join(os.tmpdir(), `vertex-dir-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Helper to clean up test resources
function cleanup(pathToClean) {
  try {
    if (fs.existsSync(pathToClean)) {
      const stats = fs.statSync(pathToClean);
      if (stats.isDirectory()) {
        fs.rmSync(pathToClean, { recursive: true, force: true });
      } else {
        fs.unlinkSync(pathToClean);
      }
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Generate random file content
function fileContentArb() {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n '.split('')),
    { minLength: 1, maxLength: 100 }
  );
}

// Generate random non-existent path
function nonExistentPathArb() {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    { minLength: 5, maxLength: 20 }
  ).map(s => path.join(os.tmpdir(), `nonexistent-${s}-${Date.now()}`));
}

describe('ScriptMod Script Path Validation', () => {
  let scriptMod;

  beforeAll(() => {
    scriptMod = new ScriptMod();
  });

  /**
   * **Feature: vertex-install-script, Property 5: Script Path Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any existing file path, validateScriptPath SHALL return valid: true.
   */
  test('Property 5: existing file paths are validated as valid', async () => {
    await fc.assert(
      fc.asyncProperty(fileContentArb(), async (content) => {
        const { testDir, filePath } = createTestFile(content);
        
        try {
          const result = scriptMod.validateScriptPath(filePath);
          return result.valid === true && result.error === undefined;
        } finally {
          cleanup(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 5: Script Path Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any non-existent path, validateScriptPath SHALL return valid: false
   * with an appropriate error message.
   */
  test('Property 5: non-existent paths are validated as invalid', async () => {
    await fc.assert(
      fc.asyncProperty(nonExistentPathArb(), async (fakePath) => {
        // Ensure path doesn't exist
        if (fs.existsSync(fakePath)) {
          return true; // Skip if path happens to exist
        }
        
        const result = scriptMod.validateScriptPath(fakePath);
        return (
          result.valid === false &&
          typeof result.error === 'string' &&
          result.error.includes('not found')
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 5: Script Path Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any directory path (not a file), validateScriptPath SHALL
   * return valid: false with an appropriate error message.
   */
  test('Property 5: directory paths are validated as invalid', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const testDir = createTestDir();
        
        try {
          const result = scriptMod.validateScriptPath(testDir);
          return (
            result.valid === false &&
            typeof result.error === 'string' &&
            result.error.includes('not a file')
          );
        } finally {
          cleanup(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 5: Script Path Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: For empty or null paths, validateScriptPath SHALL return valid: false
   * with an appropriate error message.
   */
  test('Property 5: empty or invalid paths return appropriate errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('', null, undefined, 123, {}, []),
        async (invalidPath) => {
          const result = scriptMod.validateScriptPath(invalidPath);
          return (
            result.valid === false &&
            typeof result.error === 'string' &&
            result.error.includes('required')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 5: Script Path Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: Validation result for existing files SHALL be consistent
   * across multiple calls with the same path.
   */
  test('Property 5: validation is consistent for same path', async () => {
    await fc.assert(
      fc.asyncProperty(fileContentArb(), fc.integer({ min: 2, max: 5 }), async (content, numCalls) => {
        const { testDir, filePath } = createTestFile(content);
        
        try {
          const results = [];
          for (let i = 0; i < numCalls; i++) {
            results.push(scriptMod.validateScriptPath(filePath));
          }
          
          // All results should be identical
          return results.every(r => r.valid === true);
        } finally {
          cleanup(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });
});
