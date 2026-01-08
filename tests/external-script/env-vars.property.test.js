/**
 * Property-Based Tests for ExternalScript Environment Variable Injection
 * 
 * **Feature: vertex-install-script, Property 7: Environment Variable Injection**
 * **Validates: Requirements 6.2**
 * 
 * Property: For any External_Script with configured environment variables,
 * executing the script SHALL make all configured environment variables 
 * available in the script's execution context.
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
function createTestScript(content) {
  const testDir = path.join(os.tmpdir(), `vertex-env-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

// Generate valid environment variable key (uppercase letters and underscores)
function envKeyArb() {
  return fc.stringOf(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
    { minLength: 1, maxLength: 20 }
  ).filter(s => /^[A-Z][A-Z_]*$/.test(s)); // Must start with letter
}

// Generate safe environment variable value
function envValueArb() {
  return fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
    { minLength: 1, maxLength: 50 }
  );
}

describe('ExternalScript Environment Variable Injection', () => {
  /**
   * **Feature: vertex-install-script, Property 7: Environment Variable Injection**
   * **Validates: Requirements 6.2**
   * 
   * Property: For any single environment variable configured,
   * the script SHALL have access to that variable during execution.
   */
  test('Property 7: single environment variable is injected', async () => {
    await fc.assert(
      fc.asyncProperty(envKeyArb(), envValueArb(), async (key, value) => {
        const scriptContent = `#!/bin/bash\necho "\${${key}}"`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-single-env',
            alias: 'Test single env var',
            scriptPath,
            interpreter: 'bash',
            envVars: [{ key, value }],
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.stdout.trim() === value;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 7: Environment Variable Injection**
   * **Validates: Requirements 6.2**
   * 
   * Property: For any set of multiple environment variables configured,
   * all variables SHALL be available in the script's execution context.
   */
  test('Property 7: multiple environment variables are injected', async () => {
    const envVarArb = fc.record({
      key: envKeyArb(),
      value: envValueArb()
    });
    
    // Generate 1-5 unique env vars
    const envVarsArb = fc.array(envVarArb, { minLength: 1, maxLength: 5 })
      .map(vars => {
        // Make keys unique by adding index
        return vars.map((v, i) => ({
          key: `${v.key}${i}`,
          value: v.value
        }));
      });
    
    await fc.assert(
      fc.asyncProperty(envVarsArb, async (envVars) => {
        // Create script that outputs all env vars
        const echoStatements = envVars.map(v => `echo "\${${v.key}}"`).join('\n');
        const scriptContent = `#!/bin/bash\n${echoStatements}`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-multi-env',
            alias: 'Test multiple env vars',
            scriptPath,
            interpreter: 'bash',
            envVars,
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          // Check that all values are in output
          const outputLines = result.stdout.trim().split('\n');
          return envVars.every((v, i) => outputLines[i] === v.value);
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 7: Environment Variable Injection**
   * **Validates: Requirements 6.2**
   * 
   * Property: Environment variables SHALL be available regardless of
   * the interpreter used (bash, sh, node).
   */
  test('Property 7: env vars work across interpreters', async () => {
    await fc.assert(
      fc.asyncProperty(envKeyArb(), envValueArb(), async (key, value) => {
        // Test with node interpreter
        const scriptContent = `console.log(process.env.${key});`;
        const testDir = path.join(os.tmpdir(), `vertex-env-node-${Date.now()}-${Math.random().toString(36).substring(7)}`);
        fs.mkdirSync(testDir, { recursive: true });
        const scriptPath = path.join(testDir, 'test.js');
        fs.writeFileSync(scriptPath, scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-node-env',
            alias: 'Test node env var',
            scriptPath,
            interpreter: 'node',
            envVars: [{ key, value }],
            timeout: 10
          });
          
          const result = await script.execute();
          script.destroy();
          
          return result.stdout.trim() === value;
        } finally {
          cleanupTestDir(testDir);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 7: Environment Variable Injection**
   * **Validates: Requirements 6.2**
   * 
   * Property: Empty envVars array SHALL not cause errors and script
   * SHALL execute normally with system environment variables.
   */
  test('Property 7: empty envVars does not cause errors', async () => {
    await fc.assert(
      fc.asyncProperty(envValueArb(), async (outputText) => {
        const scriptContent = `#!/bin/bash\necho "${outputText}"`;
        const { testDir, scriptPath } = createTestScript(scriptContent);
        
        try {
          const script = new ExternalScript({
            id: 'test-empty-env',
            alias: 'Test empty env vars',
            scriptPath,
            interpreter: 'bash',
            envVars: [],
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
});
