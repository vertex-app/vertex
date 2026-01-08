# Implementation Plan

## Part 1: VERTEX One-Click Install Script

- [x] 1. Create install.sh script with core functions





  - [x] 1.1 Create install.sh with dependency check functions


    - Implement `check_docker()` and `check_docker_compose()` functions
    - Display clear error messages when dependencies are missing
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Write property test for dependency detection



    - **Property 1: Dependency Detection Accuracy**
    - **Validates: Requirements 1.1**

  - [x] 1.3 Implement password generation function

    - Generate secure random 16+ character passwords
    - Use alphanumeric characters
    - _Requirements: 2.2_
  - [x] 1.4 Write property test for password generation

    - **Property 3: Password Generation Security**
    - **Validates: Requirements 2.2**
  - [x] 1.5 Implement directory setup function


    - Create installation directory with proper permissions
    - Set up data subdirectories
    - _Requirements: 2.1_
  - [x] 1.6 Write property test for directory creation

    - **Property 2: Directory Creation with Permissions**
    - **Validates: Requirements 2.1**

- [x] 2. Implement Docker Compose configuration generation





  - [x] 2.1 Create docker-compose.yml generation function


    - Generate docker-compose.yml with VERTEX image
    - Configure restart policy as 'always'
    - Set up volume mounts for data persistence
    - _Requirements: 2.3, 3.1_
  - [x] 2.2 Implement service startup and result display


    - Start containers using docker-compose
    - Display access URL and credentials on success
    - Provide start/stop/status commands
    - _Requirements: 1.4, 3.2, 3.3_


- [x] 3. Implement error handling and cleanup





  - [x] 3.1 Create error handler function

    - Display descriptive error messages
    - Suggest possible solutions
    - _Requirements: 4.1, 4.2_

  - [x] 3.2 Implement cleanup function

    - Remove partially created resources on failure
    - Clean up directories and files
    - _Requirements: 4.3_
  - [x] 3.3 Write property test for cleanup on failure



    - **Property 4: Cleanup on Failure**
    - **Validates: Requirements 4.3**

- [x] 4. Checkpoint - Ensure install script works






  - Ensure all tests pass, ask the user if questions arise.

## Part 2: External Script Runner

- [x] 5. Create ExternalScript class for script execution





  - [x] 5.1 Create app/common/ExternalScript.js


    - Implement constructor with config parsing
    - Implement `execute()` method using child_process.spawn
    - Implement `destroy()` method for cleanup
    - Handle stdout/stderr capture
    - _Requirements: 5.1, 5.2, 10.1_
  - [x] 5.2 Write property test for output capture



    - **Property 12: Output Capture Completeness**
    - **Validates: Requirements 10.1, 10.3**
  - [x] 5.3 Implement interpreter selection logic

    - Support python, python3, node, bash, sh interpreters
    - Support custom command execution
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 5.4 Write property test for interpreter execution


    - **Property 8: Interpreter Execution**
    - **Validates: Requirements 7.2, 7.3**
  - [x] 5.5 Implement environment variable injection

    - Parse envVars array from config
    - Inject into child process environment
    - _Requirements: 6.1, 6.2_
  - [x] 5.6 Write property test for environment variable injection


    - **Property 7: Environment Variable Injection**
    - **Validates: Requirements 6.2**
  - [x] 5.7 Implement timeout handling

    - Set default timeout to 300 seconds
    - Terminate process on timeout
    - Log timeout events
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 5.8 Write property test for timeout enforcement


    - **Property 13: Timeout Enforcement**
    - **Validates: Requirements 11.2, 11.3**

- [x] 6. Extend ScriptMod.js to support external scripts





  - [x] 6.1 Add external script fields to data model


    - Add type, scriptPath, workingDir, interpreter, customCommand, envVars, timeout fields
    - Update add/modify/delete methods
    - _Requirements: 5.2, 5.4_
  - [x] 6.2 Write property test for configuration persistence



    - **Property 6: Configuration Persistence**
    - **Validates: Requirements 5.4**
  - [x] 6.3 Implement script path validation


    - Validate path exists on filesystem
    - Return appropriate error for invalid paths
    - _Requirements: 5.3_
  - [x] 6.4 Write property test for script path validation


    - **Property 5: Script Path Validation**
    - **Validates: Requirements 5.3**
  - [x] 6.5 Update run method to handle external scripts


    - Detect script type and route to appropriate executor
    - Return execution result status
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 6.6 Write property test for execution result reporting


    - **Property 11: Execution Result Reporting**
    - **Validates: Requirements 9.3**

- [x] 7. Extend Script.js (common) for cron scheduling





  - [x] 7.1 Update Script class to support external scripts


    - Detect script type in constructor
    - Create ExternalScript instance for external type
    - _Requirements: 8.1, 8.2_
  - [x] 7.2 Write property test for cron schedule parsing



    - **Property 9: Cron Schedule Parsing**
    - **Validates: Requirements 8.1**
  - [x] 7.3 Implement enable/disable handling


    - Stop scheduled jobs when disabled
    - Prevent execution of disabled scripts
    - _Requirements: 8.3_
  - [x] 7.4 Write property test for disabled script non-execution


    - **Property 10: Disabled Script Non-Execution**
    - **Validates: Requirements 8.3**

- [x] 8. Checkpoint - Ensure backend works






  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Extend Script.vue for external script UI





  - [x] 9.1 Add script type selector


    - Add radio buttons for inline/external type selection
    - Show/hide relevant fields based on type
    - _Requirements: 5.1_
  - [x] 9.2 Add external script configuration fields


    - Add script path input with validation feedback
    - Add working directory input
    - Add interpreter dropdown (python, python3, node, bash, sh, custom)
    - Add custom command input (shown when interpreter is 'custom')
    - Add timeout input with default value
    - _Requirements: 5.2, 7.1, 11.1_
  - [x] 9.3 Add environment variables editor


    - Add key-value pair list editor
    - Support add/remove environment variables
    - Mask sensitive values in display
    - _Requirements: 6.1, 6.3_
  - [x] 9.4 Update form submission to include new fields


    - Include all external script fields in API request
    - Handle validation errors
    - _Requirements: 5.4_

- [x] 10. Add execution log display





  - [x] 10.1 Create execution log storage in backend


    - Store recent execution logs per script
    - Include timestamp, exitCode, stdout, stderr, duration, timedOut
    - _Requirements: 10.2, 10.3_
  - [x] 10.2 Add log display component in Script.vue



    - Show recent execution logs
    - Display stdout/stderr output
    - Show success/failure status
    - _Requirements: 10.2, 9.3_

- [x] 11. Final Checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.
