/**
 * Property-Based Tests for ExternalScript Timeout Enforcement
 * 
 * **Feature: vertex-install-script, Property 13: Timeout Enforcement**
 * **Validates: Requirements 11.2, 11.3**
 * 
 * Property: For any External_Script execution that exceeds the configured timeout,
 * the Script_Task SHALL terminate the process and log the timeout event with 
 * the configured timeout value.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const fc = require('fast-check');

// Mock logger to capture log calls
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../app/libs/logger', () => mockLogger);

const ExternalScript = require('../../app/common/ExternalScript');

// Helper to create a temporary test script
function createTestScript(content) {
  const testDir = path.join(os.tmpdir(), `vertex-timeout-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  const scriptPath = path.join(testDir, 'test.sh');
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

describe('ExternalScript Timeout Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: vertex-install-script, Property 13: Timeout Enforcement**
   * **Validates: Requirements 11.2, 11.3**
   * 
   * Property: For any script that runs longer than the configured timeout,
   * the process SHALL be terminated and timedOut flag SHALL be true.
   */
  test('Property 13: scripts exceeding timeout are terminated', async () => {
    // Use small timeout values for testing (1-3 seconds)
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 2 }), async (timeoutSec) => {
        // Script that sleeps longer than timeout
        const sleepTime = timeoutSec + 2;
        const scriptContent = `#!/bin/bash\nsleep ${sleepTime}\necho "completed"`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-timeout',
            alias: 'Test timeout',
            scriptPath,
            interpreter: 'bash',
            timeout: timeoutSec
          });
          
          const startTime = Date.now();
          const result = await script.execute();
          const elapsed = (Date.now() - startTime) / 1000;
          script.destroy();
          
          // Should have timed out
          const didTimeout = result.timedOut === true;
          
          // Should have terminated around the timeout value (with some tolerance)
          const terminatedNearTimeout = elapsed < sleepTime && elapsed >= timeoutSec * 0.8;
          
          // stdout should NOT contain "completed" since script was killed
          const notCompleted = !result.stdout.includes('completed');
          
          return didTimeout && terminatedNearTimeout && notCompleted;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 10 } // Fewer runs due to time-based nature
    );
  }, 30000); // Increase Jest timeout

  /**
   * **Feature: vertex-install-script, Property 13: Timeout Enforcement**
   * **Validates: Requirements 11.2, 11.3**
   * 
   * Property: For any timeout event, the stderr SHALL contain a message
   * indicating the timeout with the configured timeout value.
   */
  test('Property 13: timeout message includes configured timeout value', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 2 }), async (timeoutSec) => {
        const scriptContent = `#!/bin/bash\nsleep 10`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-timeout-msg',
            alias: 'Test timeout message',
            scriptPath,
            interpreter: 'bash',
            timeout: timeoutSec
          });
          
          const result = await script.execute();
          script.destroy();
          
          // stderr should mention timeout and the configured value
          const hasTimeoutMessage = result.stderr.includes('timeout') && 
                                    result.stderr.includes(String(timeoutSec));
          
          return result.timedOut && hasTimeoutMessage;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 10 }
    );
  }, 30000);

  /**
   * **Feature: vertex-install-script, Property 13: Timeout Enforcement**
   * **Validates: Requirements 11.2, 11.3**
   * 
   * Property: For any timeout event, the execution log SHALL record
   * the timeout with timedOut flag set to true.
   */
  test('Property 13: timeout is recorded in execution log', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 2 }), async (timeoutSec) => {
        const scriptContent = `#!/bin/bash\nsleep 10`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-timeout-log',
            alias: 'Test timeout logging',
            scriptPath,
            interpreter: 'bash',
            timeout: timeoutSec
          });
          
          await script.execute();
          const logs = script.getExecutionLogs();
          script.destroy();
          
          // Log should exist and have timedOut flag
          const hasLog = logs.length > 0;
          const logHasTimeout = hasLog && logs[0].timedOut === true;
          
          return hasLog && logHasTimeout;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 10 }
    );
  }, 30000);

  /**
   * **Feature: vertex-install-script, Property 13: Timeout Enforcement**
   * **Validates: Requirements 11.2, 11.3**
   * 
   * Property: For any script that completes before timeout,
   * the timedOut flag SHALL be false.
   */
  test('Property 13: scripts completing before timeout have timedOut=false', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 5, max: 10 }), async (timeoutSec) => {
        // Script that completes quickly
        const scriptContent = `#!/bin/bash\necho "done"`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-no-timeout',
            alias: 'Test no timeout',
            scriptPath,
            interpreter: 'bash',
            timeout: timeoutSec
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.timedOut === false && 
                 result.exitCode === 0 && 
                 result.stdout.trim() === 'done';
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 13: Timeout Enforcement**
   * **Validates: Requirements 11.1**
   * 
   * Property: Default timeout SHALL be 300 seconds when not specified.
   */
  test('Property 13: default timeout is 300 seconds', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const script = new ExternalScript({
          id: 'test-default-timeout',
          alias: 'Test default timeout',
          scriptPath: '/nonexistent/path.sh',
          interpreter: 'bash'
          // timeout not specified
        });
        
        const hasDefaultTimeout = script.timeout === 300;
        script.destroy();
        
        return hasDefaultTimeout;
      }),
      { numRuns: 100 }
    );
  });
});
