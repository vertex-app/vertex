/**
 * Property-Based Tests for Script Cron Schedule Parsing
 * 
 * **Feature: vertex-install-script, Property 9: Cron Schedule Parsing**
 * **Validates: Requirements 8.1**
 * 
 * Property: For any valid cron expression, the Script_Task SHALL correctly
 * parse and schedule the script to run at the times specified by the expression.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const fc = require('fast-check');
const cron = require('node-cron');

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
  const testDir = path.join(os.tmpdir(), `vertex-cron-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

/**
 * Generate valid cron expressions
 * Cron format: minute hour day-of-month month day-of-week
 */
function validCronExpressionArb() {
  const minuteArb = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 0, max: 59 }).map(n => n.toString()),
    fc.constant('*/5'),
    fc.constant('*/10'),
    fc.constant('*/15')
  );
  
  const hourArb = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 0, max: 23 }).map(n => n.toString()),
    fc.constant('*/2'),
    fc.constant('*/6')
  );
  
  const dayOfMonthArb = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 1, max: 28 }).map(n => n.toString())
  );
  
  const monthArb = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 1, max: 12 }).map(n => n.toString())
  );
  
  const dayOfWeekArb = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 0, max: 6 }).map(n => n.toString())
  );
  
  return fc.tuple(minuteArb, hourArb, dayOfMonthArb, monthArb, dayOfWeekArb)
    .map(([minute, hour, dayOfMonth, month, dayOfWeek]) => 
      `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
    );
}

// Generate safe string for script alias
function safeStringArb(minLength = 1, maxLength = 20) {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
    { minLength, maxLength }
  );
}

describe('Script Cron Schedule Parsing', () => {
  /**
   * **Feature: vertex-install-script, Property 9: Cron Schedule Parsing**
   * **Validates: Requirements 8.1**
   * 
   * Property: For any valid cron expression, the Script class SHALL
   * accept and validate the cron expression without errors.
   */
  test('Property 9: valid cron expressions are accepted for inline scripts', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          // Verify the cron expression is valid using node-cron's validate function
          const isValid = cron.validate(cronExpr);
          if (!isValid) {
            // Skip invalid expressions (shouldn't happen with our generator)
            return true;
          }
          
          const scriptId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: true,
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Verify the script was created with the correct cron expression
            const cronMatches = script.cron === cronExpr;
            
            // Verify a job was scheduled (job should exist for enabled inline scripts)
            const jobScheduled = script.job !== null;
            
            return cronMatches && jobScheduled;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 9: Cron Schedule Parsing**
   * **Validates: Requirements 8.1**
   * 
   * Property: For any valid cron expression with external scripts,
   * the Script class SHALL correctly delegate to ExternalScript.
   */
  test('Property 9: valid cron expressions are accepted for external scripts', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          // Verify the cron expression is valid
          const isValid = cron.validate(cronExpr);
          if (!isValid) {
            return true;
          }
          
          // Create a test script file
          const scriptContent = '#!/bin/bash\necho "test"';
          const { testDir, scriptPath } = createTestScript(scriptContent, 'test.sh');
          
          try {
            const scriptId = `test-ext-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            const script = new Script({
              id: scriptId,
              alias: alias,
              cron: cronExpr,
              enable: true,
              type: 'external',
              scriptPath: scriptPath,
              interpreter: 'bash',
              timeout: 10
            });
            
            try {
              // Verify the script was created with the correct cron expression
              const cronMatches = script.cron === cronExpr;
              
              // Verify it's recognized as external type
              const isExternal = script.type === 'external';
              
              // Verify ExternalScript instance was created
              const hasExternalScript = script.externalScript !== null;
              
              return cronMatches && isExternal && hasExternalScript;
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
   * **Feature: vertex-install-script, Property 9: Cron Schedule Parsing**
   * **Validates: Requirements 8.1**
   * 
   * Property: For any valid cron expression, the scheduled job
   * SHALL be stoppable via destroy().
   */
  test('Property 9: scheduled jobs can be stopped via destroy', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCronExpressionArb(),
        safeStringArb(),
        async (cronExpr, alias) => {
          const isValid = cron.validate(cronExpr);
          if (!isValid) {
            return true;
          }
          
          const scriptId = `test-destroy-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: true,
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          // Verify job exists before destroy
          const hadJob = script.job !== null;
          
          // Destroy the script
          script.destroy();
          
          // Verify job is cleaned up after destroy
          const jobCleanedUp = script.job === null;
          
          return hadJob && jobCleanedUp;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 9: Cron Schedule Parsing**
   * **Validates: Requirements 8.1**
   * 
   * Property: Common cron patterns should be correctly parsed.
   */
  test('Property 9: common cron patterns are correctly parsed', async () => {
    const commonPatterns = [
      '* * * * *',       // Every minute
      '0 * * * *',       // Every hour
      '0 0 * * *',       // Every day at midnight
      '0 8 * * *',       // Every day at 8am
      '*/5 * * * *',     // Every 5 minutes
      '*/15 * * * *',    // Every 15 minutes
      '0 */2 * * *',     // Every 2 hours
      '0 0 * * 0',       // Every Sunday at midnight
      '0 0 1 * *',       // First day of every month
      '30 4 * * *',      // Every day at 4:30am
    ];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...commonPatterns),
        safeStringArb(),
        async (cronExpr, alias) => {
          const scriptId = `test-common-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const script = new Script({
            id: scriptId,
            alias: alias,
            cron: cronExpr,
            enable: true,
            type: 'inline',
            script: '() => { return Promise.resolve(); }'
          });
          
          try {
            // Verify the cron expression was stored correctly
            const cronMatches = script.cron === cronExpr;
            
            // Verify a job was scheduled
            const jobScheduled = script.job !== null;
            
            return cronMatches && jobScheduled;
          } finally {
            script.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
