const cron = require('node-cron');
const logger = require('../libs/logger');
const ExternalScript = require('./ExternalScript');

/**
 * Script class for managing scheduled script execution.
 * Supports both inline JavaScript scripts and external scripts (Python, Shell, etc.)
 * 
 * For inline scripts: executes JavaScript code via eval
 * For external scripts: delegates to ExternalScript class
 */
class Script {
  /**
   * Create a new Script instance
   * @param {Object} script - Script configuration
   * @param {string} script.id - Unique script identifier
   * @param {string} script.alias - Human-readable script name
   * @param {string} script.cron - Cron expression for scheduling
   * @param {boolean} [script.enable=true] - Whether the script is enabled
   * @param {string} [script.type='inline'] - Script type: 'inline' or 'external'
   * @param {string} [script.script] - Inline JavaScript code (for inline type)
   * @param {string} [script.scriptPath] - Path to external script file (for external type)
   * @param {string} [script.workingDir] - Working directory for external script
   * @param {string} [script.interpreter] - Interpreter for external script
   * @param {string} [script.customCommand] - Custom command for external script
   * @param {Array} [script.envVars] - Environment variables for external script
   * @param {number} [script.timeout] - Timeout in seconds for external script
   */
  constructor (script) {
    this.id = script.id;
    this.alias = script.alias;
    this.cron = script.cron;
    this.enable = script.enable !== false;
    this.type = script.type || 'inline';
    
    // Store the full config for reference
    this._config = script;
    
    // Initialize based on script type
    if (this.type === 'external') {
      // For external scripts, create an ExternalScript instance
      this.externalScript = new ExternalScript(script);
      this.script = null;
      this.job = null;
      
      // ExternalScript handles its own cron scheduling
      // So we don't need to create a separate job here
    } else {
      // For inline scripts, use the existing behavior
      this.script = script.script;
      this.externalScript = null;
      
      // Only schedule if enabled
      if (this.enable && this.cron) {
        this._startCronJob();
      } else {
        this.job = null;
      }
    }
  }

  /**
   * Start the cron job for inline script execution
   * @private
   */
  _startCronJob () {
    if (this.job) {
      this.job.stop();
    }
    
    // eslint-disable-next-line no-eval
    this.job = cron.schedule(this.cron, async () => {
      // Double-check enable status before execution
      if (!this.enable) {
        return;
      }
      try {
        // eslint-disable-next-line no-eval
        const f = eval(this.script);
        await f();
      } catch (e) {
        logger.error(`Script [${this.alias}] execution error:`, e);
      }
    });
  }

  /**
   * Execute the script manually (outside of cron schedule)
   * @returns {Promise<Object>} Execution result
   */
  async execute () {
    // Prevent execution if disabled
    if (!this.enable) {
      return {
        success: false,
        error: 'Script is disabled'
      };
    }
    
    if (this.type === 'external' && this.externalScript) {
      const result = await this.externalScript.execute();
      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration: result.duration,
        timedOut: result.timedOut
      };
    }
    
    // Execute inline script
    try {
      // eslint-disable-next-line no-eval
      const f = eval(this.script);
      await f();
      return { success: true };
    } catch (e) {
      logger.error(`Script [${this.alias}] execution error:`, e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Check if the script is enabled
   * @returns {boolean}
   */
  isEnabled () {
    return this.enable;
  }

  /**
   * Enable the script and start scheduling
   */
  setEnabled (enabled) {
    this.enable = enabled;
    
    if (this.type === 'external' && this.externalScript) {
      // For external scripts, we need to recreate the ExternalScript instance
      // since it manages its own cron job based on enable status
      this.externalScript.destroy();
      this._config.enable = enabled;
      this.externalScript = new ExternalScript(this._config);
    } else {
      // For inline scripts, start or stop the cron job
      if (enabled && this.cron && !this.job) {
        this._startCronJob();
      } else if (!enabled && this.job) {
        this.job.stop();
        this.job = null;
      }
    }
  }

  /**
   * Get execution logs (only available for external scripts)
   * @returns {Array} Execution logs
   */
  getExecutionLogs () {
    if (this.type === 'external' && this.externalScript) {
      return this.externalScript.getExecutionLogs();
    }
    return [];
  }

  /**
   * Destroy the script instance and clean up resources
   */
  destroy () {
    // Stop cron job for inline scripts
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    
    // Destroy external script instance
    if (this.externalScript) {
      this.externalScript.destroy();
      this.externalScript = null;
    }
    
    // Remove from global registry
    if (global.runningScript && global.runningScript[this.id]) {
      delete global.runningScript[this.id];
    }
  }
}

module.exports = Script;
