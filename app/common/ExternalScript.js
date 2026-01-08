const { spawn } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const logger = require('../libs/logger');

/**
 * ExternalScript class for executing external script files (Python, Shell, Node.js, etc.)
 * 
 * Supports:
 * - Multiple interpreters (python, python3, node, bash, sh)
 * - Custom command execution
 * - Environment variable injection
 * - Timeout handling
 * - stdout/stderr capture
 * - Cron scheduling
 */
class ExternalScript {
  constructor (config) {
    this.id = config.id;
    this.alias = config.alias;
    this.cron = config.cron;
    this.scriptPath = config.scriptPath;
    this.workingDir = config.workingDir || path.dirname(config.scriptPath);
    this.interpreter = config.interpreter || 'bash';
    this.customCommand = config.customCommand || '';
    this.envVars = config.envVars || [];
    this.timeout = config.timeout || 300;
    this.enable = config.enable !== false;
    
    this.job = null;
    this.currentProcess = null;
    this.executionLogs = [];
    
    // Start cron job if enabled and cron expression is provided
    if (this.enable && this.cron) {
      this._startCronJob();
    }
  }

  /**
   * Start the cron job for scheduled execution
   */
  _startCronJob () {
    if (this.job) {
      this.job.stop();
    }
    
    this.job = cron.schedule(this.cron, async () => {
      try {
        await this.execute();
      } catch (e) {
        logger.error(`ExternalScript [${this.alias}] cron execution error:`, e);
      }
    });
  }

  /**
   * Build the command and arguments based on interpreter selection
   * @returns {{ command: string, args: string[] }}
   */
  _buildCommand () {
    if (this.interpreter === 'custom' && this.customCommand) {
      // Parse custom command - first part is command, rest are args
      const parts = this.customCommand.trim().split(/\s+/);
      const command = parts[0];
      const args = [...parts.slice(1), this.scriptPath];
      return { command, args };
    }

    // Standard interpreter mapping
    const interpreterMap = {
      python: 'python',
      python3: 'python3',
      node: 'node',
      bash: 'bash',
      sh: 'sh'
    };

    const command = interpreterMap[this.interpreter] || 'bash';
    return { command, args: [this.scriptPath] };
  }

  /**
   * Build environment variables for the child process
   * @returns {Object} Environment variables object
   */
  _buildEnv () {
    const env = { ...process.env };
    
    for (const envVar of this.envVars) {
      if (envVar.key && envVar.value !== undefined) {
        env[envVar.key] = envVar.value;
      }
    }
    
    return env;
  }

  /**
   * Execute the external script
   * @returns {Promise<{ exitCode: number, stdout: string, stderr: string, duration: number, timedOut: boolean }>}
   */
  execute () {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let timeoutHandle = null;

      // Validate script path exists
      if (!fs.existsSync(this.scriptPath)) {
        const result = {
          exitCode: 1,
          stdout: '',
          stderr: `Script not found: ${this.scriptPath}`,
          duration: 0,
          timedOut: false
        };
        this._recordLog(result);
        logger.error(`ExternalScript [${this.alias}] script not found: ${this.scriptPath}`);
        resolve(result);
        return;
      }

      const { command, args } = this._buildCommand();
      const env = this._buildEnv();

      logger.info(`ExternalScript [${this.alias}] executing: ${command} ${args.join(' ')}`);

      try {
        this.currentProcess = spawn(command, args, {
          cwd: this.workingDir,
          env,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (e) {
        const result = {
          exitCode: 1,
          stdout: '',
          stderr: `Failed to spawn process: ${e.message}`,
          duration: Date.now() - startTime,
          timedOut: false
        };
        this._recordLog(result);
        logger.error(`ExternalScript [${this.alias}] spawn error:`, e);
        resolve(result);
        return;
      }

      // Capture stdout
      this.currentProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      this.currentProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Set up timeout
      if (this.timeout > 0) {
        timeoutHandle = setTimeout(() => {
          timedOut = true;
          logger.warn(`ExternalScript [${this.alias}] timed out after ${this.timeout} seconds`);
          
          if (this.currentProcess) {
            this.currentProcess.kill('SIGTERM');
            
            // Force kill after 5 seconds if still running
            setTimeout(() => {
              if (this.currentProcess && !this.currentProcess.killed) {
                this.currentProcess.kill('SIGKILL');
              }
            }, 5000);
          }
        }, this.timeout * 1000);
      }

      // Handle process completion
      this.currentProcess.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        const duration = Date.now() - startTime;
        const exitCode = code !== null ? code : (timedOut ? -1 : 1);
        
        const result = {
          exitCode,
          stdout,
          stderr: timedOut ? `${stderr}\nProcess terminated: timeout after ${this.timeout} seconds` : stderr,
          duration,
          timedOut
        };

        this._recordLog(result);
        this.currentProcess = null;

        if (timedOut) {
          logger.warn(`ExternalScript [${this.alias}] execution timed out after ${this.timeout}s`);
        } else if (exitCode !== 0) {
          logger.error(`ExternalScript [${this.alias}] exited with code ${exitCode}: ${stderr}`);
        } else {
          logger.info(`ExternalScript [${this.alias}] completed successfully in ${duration}ms`);
        }

        resolve(result);
      });

      // Handle process errors
      this.currentProcess.on('error', (err) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        const duration = Date.now() - startTime;
        const result = {
          exitCode: 1,
          stdout,
          stderr: `${stderr}\nProcess error: ${err.message}`,
          duration,
          timedOut: false
        };

        this._recordLog(result);
        this.currentProcess = null;
        logger.error(`ExternalScript [${this.alias}] process error:`, err);
        resolve(result);
      });
    });
  }

  /**
   * Record execution log
   * @param {{ exitCode: number, stdout: string, stderr: string, duration: number, timedOut: boolean }} result
   */
  _recordLog (result) {
    const logEntry = {
      scriptId: this.id,
      timestamp: Date.now(),
      ...result
    };

    // Keep only the last 10 execution logs
    this.executionLogs.push(logEntry);
    if (this.executionLogs.length > 10) {
      this.executionLogs.shift();
    }
  }

  /**
   * Get recent execution logs
   * @returns {Array} Recent execution logs
   */
  getExecutionLogs () {
    return [...this.executionLogs];
  }

  /**
   * Destroy the script instance and clean up resources
   */
  destroy () {
    // Stop cron job
    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    // Kill any running process
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      setTimeout(() => {
        if (this.currentProcess && !this.currentProcess.killed) {
          this.currentProcess.kill('SIGKILL');
        }
      }, 5000);
      this.currentProcess = null;
    }

    // Remove from global registry
    if (global.runningScript && global.runningScript[this.id]) {
      delete global.runningScript[this.id];
    }
  }
}

module.exports = ExternalScript;
