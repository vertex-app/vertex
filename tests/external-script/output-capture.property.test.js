/**
 * Property-Based Tests for ExternalScript Output Capture
 * 
 * **Feature: vertex-install-script, Property 12: Output Capture Completeness**
 * **Validates: Requirements 10.1, 10.3**
 * 
 * Property: For any External_Script execution, the Script_Task SHALL capture 
 * all stdout and stderr output and record any error messages with the exit code.
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
function createTestScript(content, extension = 'sh') {
  const testDir = path.join(os.tmpdir(), `vertex-output-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  const scriptPath = path.join(testDir, `test-script.${extension}`);
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
function safeStringArb(minLength = 0, maxLength = 100) {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('')),
    { minLength, maxLength }
  );
}

describe('ExternalScript Output Capture', () => {
  /**
   * **Feature: vertex-install-script, Property 12: Output Capture Completeness**
   * **Validates: Requirements 10.1, 10.3**
   * 
   * Property: For any stdout output produced by a script, the ExternalScript
   * SHALL capture the complete output in the result.
   */
  test('Property 12: stdout is captured completely', async () => {
    await fc.assert(
      fc.asyncProperty(safeStringArb(1, 50), async (outputText) => {
        const scriptContent = `#!/bin/bash\necho "${outputText}"`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-stdout',
            alias: 'Test stdout capture',
            scriptPath,
            interpreter: 'bash',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          // stdout should contain the output text
          return result.stdout.trim() === outputText;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 12: Output Capture Completeness**
   * **Validates: Requirements 10.1, 10.3**
   * 
   * Property: For any stderr output produced by a script, the ExternalScript
   * SHALL capture the complete error output in the result.
   */
  test('Property 12: stderr is captured completely', async () => {
    await fc.assert(
      fc.asyncProperty(safeStringArb(1, 50), async (errorText) => {
        const scriptContent = `#!/bin/bash\necho "${errorText}" >&2`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-stderr',
            alias: 'Test stderr capture',
            scriptPath,
            interpreter: 'bash',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          // stderr should contain the error text
          return result.stderr.trim() === errorText;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 12: Output Capture Completeness**
   * **Validates: Requirements 10.1, 10.3**
   * 
   * Property: For any exit code produced by a script, the ExternalScript
   * SHALL correctly record the exit code in the result.
   */
  test('Property 12: exit code is captured correctly', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 255 }), async (exitCode) => {
        const scriptContent = `#!/bin/bash\nexit ${exitCode}`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-exitcode',
            alias: 'Test exit code capture',
            scriptPath,
            interpreter: 'bash',
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          // Exit code should match
          return result.exitCode === exitCode;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 12: Output Capture Completeness**
   * **Validates: Requirements 10.1, 10.3**
   * 
   * Property: For any script execution with both stdout and stderr output,
   * both streams SHALL be captured independently and completely.
   */
  test('Property 12: both stdout and stderr are captured independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeStringArb(1, 30),
        safeStringArb(1, 30),
        async (stdoutText, stderrText) => {
          const scriptContent = `#!/bin/bash
echo "${stdoutText}"
echo "${stderrText}" >&2`;
          const { testDir, scriptPath } = createTestScript(scriptContent);
          
          try {
            const script = new ExternalScript({
              id: 'test-both',
              alias: 'Test both streams',
              scriptPath,
              interpreter: 'bash',
              timeout: 10
            });
            
            const result = await script.execute();
            script.destroy();
            
            // Both streams should be captured correctly
            return result.stdout.trim() === stdoutText && 
                   result.stderr.trim() === stderrText;
          } finally {
            cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 12: Output Capture Completeness**
   * **Validates: Requirements 10.1, 10.3**
   * 
   * Property: For any failed script execution, the error message and exit code
   * SHALL be recorded in the execution log.
   */
  test('Property 12: error messages are recorded with exit code', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeStringArb(1, 30),
        fc.integer({ min: 1, max: 255 }),
        async (errorMsg, exitCode) => {
          const scriptContent = `#!/bin/bash
echo "${errorMsg}" >&2
exit ${exitCode}`;
          const { testDir, scriptPath } = createTestScript(scriptContent);
          
          try {
            const script = new ExternalScript({
              id: 'test-error-log',
              alias: 'Test error logging',
              scriptPath,
              interpreter: 'bash',
              timeout: 10
            });
            
            const result = await script.execute();
            const logs = script.getExecutionLogs();
            script.destroy();
            
            // Result should have correct exit code and stderr
            const resultCorrect = result.exitCode === exitCode && 
                                  result.stderr.includes(errorMsg);
            
            // Log should contain the error information
            const logCorrect = logs.length > 0 && 
                               logs[0].exitCode === exitCode &&
                               logs[0].stderr.includes(errorMsg);
            
            return resultCorrect && logCorrect;
          } finally {
            cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
