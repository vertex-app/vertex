/**
 * Property-Based Tests for Disabled Script Non-Execution
 * 
 * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
 * **Validates: Requirements 8.3**
 * 
 * Property: For any disabled External_Script, the Script_Task SHALL not
 * execute the script regardless of the cron schedule.
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

const Script = require('../../app/common/Script');

// Initialize global.runningScript if not exists
beforeAll(() => {
  if (!global.runningScript) {
    global.runningScript = {};
  }
});

// Clean up after each test
afterEach(() => {
  // Clean up any running scripts
  Object.keys(global.runningScript).forEach(id => {
    if (global.runningScript[id]) {
      global.runningScript[id].destroy();
      delete global.runningScript[id];
    }
  });
});

// Helper to create a temporary test script for external scripts
function createTestScript(content, filename) {
  const testDir = path.join(os.tmpdir(), `vertex-disabled-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

// Generate safe string for script alias
function safeStringArb(minLength = 1, maxLength = 20) {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
    { minLength, maxLength }
  );
}

// Generate valid cron expressions
function validCronExpressionArb() {
  return fc.constantFrom(
    '* * * * *',
    '0 * * * *',
    '0 0 * * *',
    '*/5 * * * *',
    '0 8 * * *'
  );
}

describe('Disabled Script Non-Execution', () => {
  /**
   * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
   * **Validates: Requirements 8.3**
   * 
   * Property: For any disabled inline script, manual execution SHALL be prevented.
   */
  test('Property 10: disabled inline scripts cannot be executed manually', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          const scriptId = `test-disabled-inline-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: false, // Disabled
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Attempt to execute the disabled script
            const result = await script.execute();
            
            // Verify execution was prevented
            const executionPrevented = result.success === false;
            const hasDisabledError = result.error === 'Script is disabled';
            
            return executionPrevented && hasDisabledError;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
   * **Validates: Requirements 8.3**
   * 
   * Property: For any disabled external script, manual execution SHALL be prevented.
   */
  test('Property 10: disabled external scripts cannot be executed manually', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          // Create a test script file
          const scriptContent = '#!/bin/bash\necho "should not run"';
          const { testDir, scriptPath } = createTestScript(scriptContent, 'test.sh');
          
          try {
            const scriptId = `test-disabled-ext-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            const script = new Script({
              id: scriptId,
              alias: alias,
              cron: cronExpr,
              enable: false, // Disabled
              type: 'external',
              scriptPath: scriptPath,
              interpreter: 'bash',
              timeout: 10
            });
            
            try {
              // Attempt to execute the disabled script
              const result = await script.execute();
              
              // Verify execution was prevented
              const executionPrevented = result.success === false;
              const hasDisabledError = result.error === 'Script is disabled';
              
              return executionPrevented && hasDisabledError;
            } finally {
              script.destroy();
            }
          } finally {
            cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
   * **Validates: Requirements 8.3**
   * 
   * Property: For any disabled inline script, no cron job SHALL be scheduled.
   */
  test('Property 10: disabled inline scripts do not schedule cron jobs', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          const scriptId = `test-no-cron-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: false, // Disabled
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Verify no cron job was scheduled for disabled script
            const noCronJob = script.job === null;
            
            // Verify the script is marked as disabled
            const isDisabled = script.enable === false;
            
            return noCronJob && isDisabled;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
   * **Validates: Requirements 8.3**
   * 
   * Property: When a script is disabled via setEnabled(false), 
   * the cron job SHALL be stopped.
   */
  test('Property 10: disabling a script stops its cron job', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          const scriptId = `test-disable-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          // Create an enabled script first
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: true, // Initially enabled
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Verify cron job exists for enabled script
            const hadCronJob = script.job !== null;
            
            // Disable the script
            script.setEnabled(false);
            
            // Verify cron job was stopped
            const cronJobStopped = script.job === null;
            
            // Verify script is now disabled
            const isDisabled = script.enable === false;
            
            // Verify execution is now prevented
            const result = await script.execute();
            const executionPrevented = result.success === false && result.error === 'Script is disabled';
            
            return hadCronJob && cronJobStopped && isDisabled && executionPrevented;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
   * **Validates: Requirements 8.3**
   * 
   * Property: When a script is re-enabled via setEnabled(true),
   * the cron job SHALL be restarted.
   */
  test('Property 10: re-enabling a script restarts its cron job', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          const scriptId = `test-reenable-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          // Create a disabled script first
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: false, // Initially disabled
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Verify no cron job for disabled script
            const noCronJobInitially = script.job === null;
            
            // Enable the script
            script.setEnabled(true);
            
            // Verify cron job was started
            const cronJobStarted = script.job !== null;
            
            // Verify script is now enabled
            const isEnabled = script.enable === true;
            
            // Verify execution is now allowed
            const result = await script.execute();
            const executionAllowed = result.success === true;
            
            return noCronJobInitially && cronJobStarted && isEnabled && executionAllowed;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 10: Disabled Script Non-Execution**
   * **Validates: Requirements 8.3**
   * 
   * Property: isEnabled() SHALL correctly report the script's enable status.
   */
  test('Property 10: isEnabled correctly reports script status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        safeStringArb(),
        async (enableStatus, alias) => {
          const scriptId = `test-status-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: '* * * * *',
            enable: enableStatus,
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Verify isEnabled returns the correct status
            const statusCorrect = script.isEnabled() === enableStatus;
            
            return statusCorrect;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
