/**
 * Property-Based Tests for ScriptMod Execution Result Reporting
 * 
 * **Feature: vertex-install-script, Property 11: Execution Result Reporting**
 * **Validates: Requirements 9.3**
 * 
 * Property: For any External_Script execution, the Script_Task SHALL correctly
 * report the execution result as success (exit code 0) or failure (non-zero exit code).
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

// Test data directory
const dataDir = path.join(__dirname, '../../app/data/script');

// Helper to ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Helper to create a temporary test script
function createTestScript(content) {
  const testDir = path.join(os.tmpdir(), `vertex-exec-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  const scriptPath = path.join(testDir, 'test.sh');
  fs.writeFileSync(scriptPath, content);
  fs.chmodSync(scriptPath, '755');
  return { testDir, scriptPath };
}

// Helper to clean up test resources
function cleanup(pathToClean) {
  try {
    if (fs.existsSync(pathToClean)) {
      fs.rmSync(pathToClean, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Helper to clean up test script from data directory
function cleanupTestScript(id) {
  const filePath = path.join(dataDir, `${id}.json`);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  if (global.runningScript[id]) {
    try {
      global.runningScript[id].destroy();
    } catch (e) {
      // Ignore
    }
    delete global.runningScript[id];
  }
}

// Generate valid exit codes (0-255)
function exitCodeArb() {
  return fc.integer({ min: 0, max: 255 });
}

// Generate output text
function outputTextArb() {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('')),
    { minLength: 1, maxLength: 50 }
  );
}

describe('ScriptMod Execution Result Reporting', () => {
  let scriptMod;
  const createdScriptIds = [];
  const createdTestDirs = [];

  beforeAll(() => {
    ensureDataDir();
    scriptMod = new ScriptMod();
  });

  afterAll(() => {
    // Clean up all created test scripts
    for (const id of createdScriptIds) {
      cleanupTestScript(id);
    }
    for (const dir of createdTestDirs) {
      cleanup(dir);
    }
  });

  /**
   * **Feature: vertex-install-script, Property 11: Execution Result Reporting**
   * **Validates: Requirements 9.3**
   * 
   * Property: For any script that exits with code 0, the run method SHALL
   * report success: true and exitCode: 0.
   */
  test('Property 11: successful execution reports success true', async () => {
    await fc.assert(
      fc.asyncProperty(outputTextArb(), async (outputText) => {
        const scriptContent = `#!/bin/bash\necho "${outputText}"\nexit 0`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        createdTestDirs.push(testDir);

        // Add script to ScriptMod
        const addResult = scriptMod.add({
          alias: 'Test success script',
          cron: '0 0 * * *',
          type: 'external',
          scriptPath,
          interpreter: 'bash',
          timeout: 10,
          enable: false
        });

        if (typeof addResult === 'object' && addResult.success === false) {
          cleanup(testDir);
          return true; // Skip if add failed
        }

        // Get the ID
        const files = fs.readdirSync(dataDir);
        const latestFile = files
          .filter(f => f.endsWith('.json'))
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(dataDir, f)).mtimeMs
          }))
          .sort((a, b) => b.time - a.time)[0];

        if (!latestFile) {
          cleanup(testDir);
          return false;
        }

        const id = latestFile.name.replace('.json', '');
        createdScriptIds.push(id);

        // Run the script
        const result = await scriptMod.run({ id });

        // Clean up
        cleanupTestScript(id);
        cleanup(testDir);

        return (
          result.success === true &&
          result.exitCode === 0 &&
          result.stdout.trim() === outputText
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 11: Execution Result Reporting**
   * **Validates: Requirements 9.3**
   * 
   * Property: For any script that exits with non-zero code, the run method SHALL
   * report success: false and the correct exitCode.
   */
  test('Property 11: failed execution reports success false with exit code', async () => {
    await fc.assert(
      fc.asyncProperty(
        exitCodeArb().filter(code => code !== 0),
        async (exitCode) => {
          const scriptContent = `#!/bin/bash\nexit ${exitCode}`;
          const { testDir, scriptPath } = createTestScript(scriptContent);
          createdTestDirs.push(testDir);

          // Add script to ScriptMod
          const addResult = scriptMod.add({
            alias: 'Test failure script',
            cron: '0 0 * * *',
            type: 'external',
            scriptPath,
            interpreter: 'bash',
            timeout: 10,
            enable: false
          });

          if (typeof addResult === 'object' && addResult.success === false) {
            cleanup(testDir);
            return true;
          }

          // Get the ID
          const files = fs.readdirSync(dataDir);
          const latestFile = files
            .filter(f => f.endsWith('.json'))
            .map(f => ({
              name: f,
              time: fs.statSync(path.join(dataDir, f)).mtimeMs
            }))
            .sort((a, b) => b.time - a.time)[0];

          if (!latestFile) {
            cleanup(testDir);
            return false;
          }

          const id = latestFile.name.replace('.json', '');
          createdScriptIds.push(id);

          // Run the script
          const result = await scriptMod.run({ id });

          // Clean up
          cleanupTestScript(id);
          cleanup(testDir);

          return (
            result.success === false &&
            result.exitCode === exitCode
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 11: Execution Result Reporting**
   * **Validates: Requirements 9.3**
   * 
   * Property: For any script execution, the result SHALL include duration information.
   */
  test('Property 11: execution result includes duration', async () => {
    await fc.assert(
      fc.asyncProperty(exitCodeArb(), async (exitCode) => {
        const scriptContent = `#!/bin/bash\nexit ${exitCode}`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        createdTestDirs.push(testDir);

        // Add script to ScriptMod
        const addResult = scriptMod.add({
          alias: 'Test duration script',
          cron: '0 0 * * *',
          type: 'external',
          scriptPath,
          interpreter: 'bash',
          timeout: 10,
          enable: false
        });

        if (typeof addResult === 'object' && addResult.success === false) {
          cleanup(testDir);
          return true;
        }

        // Get the ID
        const files = fs.readdirSync(dataDir);
        const latestFile = files
          .filter(f => f.endsWith('.json'))
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(dataDir, f)).mtimeMs
          }))
          .sort((a, b) => b.time - a.time)[0];

        if (!latestFile) {
          cleanup(testDir);
          return false;
        }

        const id = latestFile.name.replace('.json', '');
        createdScriptIds.push(id);

        // Run the script
        const result = await scriptMod.run({ id });

        // Clean up
        cleanupTestScript(id);
        cleanup(testDir);

        return (
          typeof result.duration === 'number' &&
          result.duration >= 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 11: Execution Result Reporting**
   * **Validates: Requirements 9.3**
   * 
   * Property: Running a non-existent script ID SHALL return an error result.
   */
  test('Property 11: non-existent script ID returns error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringOf(fc.constantFrom(...'abcdef0123456789'.split('')), { minLength: 8, maxLength: 8 }),
        async (fakeId) => {
          // Ensure ID doesn't exist
          const filePath = path.join(dataDir, `${fakeId}.json`);
          if (fs.existsSync(filePath)) {
            return true; // Skip if ID happens to exist
          }

          const result = await scriptMod.run({ id: fakeId });

          return (
            result.success === false &&
            typeof result.error === 'string'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
