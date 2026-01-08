/**
 * Property-Based Tests for Install Script Cleanup Function
 * 
 * **Feature: vertex-install-script, Property 4: Cleanup on Failure**
 * **Validates: Requirements 4.3**
 * 
 * Property: For any installation failure, the Install_Script SHALL remove all 
 * partially created resources (directories, files) that were created during 
 * the failed installation attempt.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const fc = require('fast-check');
const os = require('os');

// Helper to create a unique test directory
function createTestDir() {
  const testDir = path.join(os.tmpdir(), `vertex-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  return testDir;
}

// Helper to check if a path exists
function pathExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

// Helper to run the cleanup function in isolation
function runCleanupTest(resources) {
  const testDir = createTestDir();
  
  // Create the resources
  const createdPaths = [];
  for (const resource of resources) {
    const fullPath = path.join(testDir, resource.name);
    try {
      if (resource.type === 'dir') {
        fs.mkdirSync(fullPath, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, resource.content || '');
      }
      createdPaths.push(fullPath);
    } catch (e) {
      // Ignore creation errors for this test
    }
  }
  
  // Create a test script that sources install.sh and runs cleanup
  const testScript = `
#!/bin/bash
source "${path.resolve('install.sh')}"

# Set up the resources array
CREATED_RESOURCES=(${createdPaths.map(p => `"${p}"`).join(' ')})
INSTALL_DIR="${testDir}"

# Run cleanup
cleanup

# Exit with success
exit 0
`;

  const scriptPath = path.join(testDir, 'test-cleanup.sh');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(scriptPath, testScript);
  fs.chmodSync(scriptPath, '755');
  
  try {
    execSync(`bash "${scriptPath}"`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e) {
    // Cleanup might fail on some resources, that's okay for this test
  }
  
  // Check which resources still exist
  const remainingResources = createdPaths.filter(p => pathExists(p));
  
  // Clean up test directory
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
  
  return {
    created: createdPaths,
    remaining: remainingResources,
    allCleaned: remainingResources.length === 0
  };
}

describe('Install Script Cleanup Function', () => {
  /**
   * **Feature: vertex-install-script, Property 4: Cleanup on Failure**
   * **Validates: Requirements 4.3**
   * 
   * Property: For any set of created resources (directories and files),
   * the cleanup function SHALL remove all of them.
   */
  test('Property 4: Cleanup removes all tracked resources', () => {
    // Arbitrary for generating resource names (safe characters only)
    const safeNameArb = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 10 }
    );
    
    // Arbitrary for generating a resource (file or directory)
    const resourceArb = fc.record({
      name: safeNameArb,
      type: fc.constantFrom('file', 'dir'),
      content: fc.string({ maxLength: 100 })
    });
    
    // Arbitrary for generating a list of resources
    const resourcesArb = fc.array(resourceArb, { minLength: 1, maxLength: 5 });
    
    fc.assert(
      fc.property(resourcesArb, (resources) => {
        // Make resource names unique by adding index
        const uniqueResources = resources.map((r, i) => ({
          ...r,
          name: `${r.name}_${i}`
        }));
        
        const result = runCleanupTest(uniqueResources);
        
        // Property: All created resources should be cleaned up
        return result.allCleaned;
      }),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 4: Cleanup on Failure**
   * **Validates: Requirements 4.3**
   * 
   * Property: Cleanup should handle nested directory structures correctly,
   * removing children before parents.
   */
  test('Property 4: Cleanup handles nested directories correctly', () => {
    const safeNameArb = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 8 }
    );
    
    // Generate nested path structures
    const nestedPathArb = fc.array(safeNameArb, { minLength: 1, maxLength: 3 })
      .map(parts => parts.join('/'));
    
    const nestedResourceArb = fc.record({
      name: nestedPathArb,
      type: fc.constantFrom('file', 'dir'),
      content: fc.string({ maxLength: 50 })
    });
    
    const nestedResourcesArb = fc.array(nestedResourceArb, { minLength: 1, maxLength: 4 });
    
    fc.assert(
      fc.property(nestedResourcesArb, (resources) => {
        const uniqueResources = resources.map((r, i) => ({
          ...r,
          name: `nested_${i}/${r.name}`
        }));
        
        const result = runCleanupTest(uniqueResources);
        return result.allCleaned;
      }),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * **Feature: vertex-install-script, Property 4: Cleanup on Failure**
   * **Validates: Requirements 4.3**
   * 
   * Property: Cleanup should be idempotent - running it multiple times
   * should have the same effect as running it once.
   */
  test('Property 4: Cleanup is idempotent', () => {
    const testDir = createTestDir();
    
    try {
      // Create some test resources
      fs.mkdirSync(testDir, { recursive: true });
      const dataDir = path.join(testDir, 'data');
      fs.mkdirSync(dataDir);
      const configFile = path.join(testDir, 'docker-compose.yml');
      fs.writeFileSync(configFile, 'version: "3"');
      
      // Create cleanup script
      const testScript = `
#!/bin/bash
source "${path.resolve('install.sh')}"
CREATED_RESOURCES=("${configFile}" "${dataDir}" "${testDir}")
INSTALL_DIR="${testDir}"
cleanup
cleanup
cleanup
exit 0
`;
      
      const scriptPath = path.join(os.tmpdir(), `idempotent-test-${Date.now()}.sh`);
      fs.writeFileSync(scriptPath, testScript);
      fs.chmodSync(scriptPath, '755');
      
      execSync(`bash "${scriptPath}"`, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      fs.unlinkSync(scriptPath);
      
      // After multiple cleanups, resources should not exist
      expect(pathExists(configFile)).toBe(false);
      expect(pathExists(dataDir)).toBe(false);
      expect(pathExists(testDir)).toBe(false);
    } finally {
      // Final cleanup
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore
      }
    }
  });
});
