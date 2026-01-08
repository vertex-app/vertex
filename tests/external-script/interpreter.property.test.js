/**
 * Property-Based Tests for ExternalScript Interpreter Execution
 * 
 * **Feature: vertex-install-script, Property 8: Interpreter Execution**
 * **Validates: Requirements 7.2, 7.3**
 * 
 * Property: For any External_Script with a specified interpreter or custom command,
 * the Script_Task SHALL execute the script using the specified interpreter or 
 * custom command string.
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

const ExternalScript = require('../../app/common/ExternalScript');

// Helper to create a temporary test script
function createTestScript(content, filename) {
  const testDir = path.join(os.tmpdir(), `vertex-interp-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  const scriptPath = path.join(testDir, filename);
  fs.writeFileSync(scriptPath, content);
  fs.chmodSync(scriptPath, '755');
  return { testDir, scriptPath };
}

// Helper to clean up test directory
function cleanupTestDir(testDir) {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Generate safe string for output (printable ASCII only)
function safeStringArb(minLength = 1, maxLength = 30) {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
    { minLength, maxLength }
  );
}

describe('ExternalScript Interpreter Execution', () => {
  /**
   * **Feature: vertex-install-script, Property 8: Interpreter Execution**
   * **Validates: Requirements 7.2, 7.3**
   * 
   * Property: For any bash script with specified bash interpreter,
   * the script SHALL be executed using bash.
   */
  test('Property 8: bash interpreter executes bash scripts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(safeStringArb(), async (outputText) => {
        const scriptContent = `#!/bin/bash\necho "${outputText}"`;
        const { testDir, scriptPath } = createTestScript(scriptContent, 'test.sh');
        
        try {
          const script = new ExternalScript({
            id: 'test-bash',
            alias: 'Test bash interpreter',
            scriptPath,
            interpreter: 'bash',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.exitCode === 0 && result.stdout.trim() === outputText;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 8: Interpreter Execution**
   * **Validates: Requirements 7.2, 7.3**
   * 
   * Property: For any sh script with specified sh interpreter,
   * the script SHALL be executed using sh.
   */
  test('Property 8: sh interpreter executes shell scripts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(safeStringArb(), async (outputText) => {
        const scriptContent = `#!/bin/sh\necho "${outputText}"`;
        const { testDir, scriptPath } = createTestScript(scriptContent, 'test.sh');
        
        try {
          const script = new ExternalScript({
            id: 'test-sh',
            alias: 'Test sh interpreter',
            scriptPath,
            interpreter: 'sh',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.exitCode === 0 && result.stdout.trim() === outputText;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 8: Interpreter Execution**
   * **Validates: Requirements 7.2, 7.3**
   * 
   * Property: For any node script with specified node interpreter,
   * the script SHALL be executed using node.
   */
  test('Property 8: node interpreter executes JavaScript correctly', async () => {
    await fc.assert(
      fc.asyncProperty(safeStringArb(), async (outputText) => {
        const scriptContent = `console.log("${outputText}");`;
        const { testDir, scriptPath } = createTestScript(scriptContent, 'test.js');
        
        try {
          const script = new ExternalScript({
            id: 'test-node',
            alias: 'Test node interpreter',
            scriptPath,
            interpreter: 'node',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.exitCode === 0 && result.stdout.trim() === outputText;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 8: Interpreter Execution**
   * **Validates: Requirements 7.2, 7.3**
   * 
   * Property: For any script with a custom command,
   * the script SHALL be executed using the custom command string.
   */
  test('Property 8: custom command executes scripts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(safeStringArb(), async (outputText) => {
        const scriptContent = `#!/bin/bash\necho "${outputText}"`;
        const { testDir, scriptPath } = createTestScript(scriptContent, 'test.sh');
        
        try {
          const script = new ExternalScript({
            id: 'test-custom',
            alias: 'Test custom command',
            scriptPath,
            interpreter: 'custom',
            customCommand: 'bash',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.exitCode === 0 && result.stdout.trim() === outputText;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 8: Interpreter Execution**
   * **Validates: Requirements 7.2, 7.3**
   * 
   * Property: For any supported interpreter, the interpreter selection
   * SHALL correctly map to the corresponding executable.
   */
  test('Property 8: interpreter selection maps correctly', async () => {
    const interpreters = ['bash', 'sh', 'node'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...interpreters),
        safeStringArb(),
        async (interpreter, outputText) => {
          let scriptContent;
          let filename;
          
          if (interpreter === 'node') {
            scriptContent = `console.log("${outputText}");`;
            filename = 'test.js';
          } else {
            scriptContent = `#!/bin/${interpreter}\necho "${outputText}"`;
            filename = 'test.sh';
          }
          
          const { testDir, scriptPath } = createTestScript(scriptContent, filename);
          
          try {
            const script = new ExternalScript({
              id: `test-${interpreter}`,
              alias: `Test ${interpreter}`,
              scriptPath,
              interpreter,
              timeout: 10
            });
            
            const result = await script.execute();
            script.destroy();
            
            return result.exitCode === 0 && result.stdout.trim() === outputText;
          } finally {
            cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
