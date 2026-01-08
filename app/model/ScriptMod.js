const fs = require('fs');
const path = require('path');
const logger = require('../libs/logger');
const Script = require('../common/Script');
const ExternalScript = require('../common/ExternalScript');

const util = require('../libs/util');

/**
 * Valid interpreter options for external scripts
 */
const VALID_INTERPRETERS = ['python', 'python3', 'node', 'bash', 'sh', 'custom'];

/**
 * Default timeout for external scripts in seconds
 */
const DEFAULT_TIMEOUT = 300;

/**
 * Maximum number of execution logs to keep per script
 */
const MAX_EXECUTION_LOGS = 10;

/**
 * Path to execution logs storage directory
 */
const EXECUTION_LOGS_DIR = path.join(__dirname, '../data/script-logs');

class ScriptMod {
  constructor () {
    // Ensure execution logs directory exists
    this._ensureLogsDirectory();
  }

  /**
   * Ensure the execution logs directory exists
   * @private
   */
  _ensureLogsDirectory () {
    if (!fs.existsSync(EXECUTION_LOGS_DIR)) {
      try {
        fs.mkdirSync(EXECUTION_LOGS_DIR, { recursive: true });
      } catch (e) {
        logger.error('Failed to create execution logs directory:', e);
      }
    }
  }

  /**
   * Get the path to a script's execution log file
   * @param {string} scriptId - Script ID
   * @returns {string} Path to the log file
   * @private
   */
  _getLogFilePath (scriptId) {
    return path.join(EXECUTION_LOGS_DIR, `${scriptId}.json`);
  }

  /**
   * Load execution logs for a script from disk
   * @param {string} scriptId - Script ID
   * @returns {Array} Execution logs array
   * @private
   */
  _loadExecutionLogs (scriptId) {
    const logFilePath = this._getLogFilePath(scriptId);
    if (!fs.existsSync(logFilePath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(logFilePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      logger.error(`Failed to load execution logs for script ${scriptId}:`, e);
      return [];
    }
  }

  /**
   * Save execution logs for a script to disk
   * @param {string} scriptId - Script ID
   * @param {Array} logs - Execution logs array
   * @private
   */
  _saveExecutionLogs (scriptId, logs) {
    this._ensureLogsDirectory();
    const logFilePath = this._getLogFilePath(scriptId);
    try {
      fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    } catch (e) {
      logger.error(`Failed to save execution logs for script ${scriptId}:`, e);
    }
  }

  /**
   * Add an execution log entry for a script
   * @param {string} scriptId - Script ID
   * @param {Object} logEntry - Log entry with timestamp, exitCode, stdout, stderr, duration, timedOut
   */
  addExecutionLog (scriptId, logEntry) {
    const logs = this._loadExecutionLogs(scriptId);
    
    // Add the new log entry with timestamp if not present
    const entry = {
      scriptId,
      timestamp: logEntry.timestamp || Date.now(),
      exitCode: logEntry.exitCode,
      stdout: logEntry.stdout || '',
      stderr: logEntry.stderr || '',
      duration: logEntry.duration || 0,
      timedOut: logEntry.timedOut || false,
      success: logEntry.success !== undefined ? logEntry.success : (logEntry.exitCode === 0),
      error: logEntry.error || null
    };
    
    logs.push(entry);
    
    // Keep only the most recent logs
    while (logs.length > MAX_EXECUTION_LOGS) {
      logs.shift();
    }
    
    this._saveExecutionLogs(scriptId, logs);
  }

  /**
   * Get execution logs for a script
   * @param {string} scriptId - Script ID
   * @returns {Array} Execution logs array
   */
  getExecutionLogs (scriptId) {
    return this._loadExecutionLogs(scriptId);
  }

  /**
   * Delete execution logs for a script
   * @param {string} scriptId - Script ID
   * @private
   */
  _deleteExecutionLogs (scriptId) {
    const logFilePath = this._getLogFilePath(scriptId);
    if (fs.existsSync(logFilePath)) {
      try {
        fs.unlinkSync(logFilePath);
      } catch (e) {
        logger.error(`Failed to delete execution logs for script ${scriptId}:`, e);
      }
    }
  }
  /**
   * Create the appropriate script instance based on type
   * @param {Object} scriptSet - Script configuration
   * @returns {Script|ExternalScript} Script instance
   */
  _createScriptInstance (scriptSet) {
    if (scriptSet.type === 'external') {
      return new ExternalScript(scriptSet);
    }
    return new Script(scriptSet);
  }

  /**
   * Normalize script configuration with defaults for external scripts
   * @param {Object} options - Raw options
   * @returns {Object} Normalized script configuration
   */
  _normalizeConfig (options) {
    const scriptSet = { ...options };
    
    // Set default type to 'inline' for backward compatibility
    if (!scriptSet.type) {
      scriptSet.type = 'inline';
    }
    
    // Add external script fields with defaults if type is external
    if (scriptSet.type === 'external') {
      scriptSet.scriptPath = scriptSet.scriptPath || '';
      scriptSet.workingDir = scriptSet.workingDir || '';
      scriptSet.interpreter = VALID_INTERPRETERS.includes(scriptSet.interpreter) 
        ? scriptSet.interpreter 
        : 'bash';
      scriptSet.customCommand = scriptSet.customCommand || '';
      scriptSet.envVars = Array.isArray(scriptSet.envVars) ? scriptSet.envVars : [];
      scriptSet.timeout = typeof scriptSet.timeout === 'number' && scriptSet.timeout > 0 
        ? scriptSet.timeout 
        : DEFAULT_TIMEOUT;
    }
    
    return scriptSet;
  }

  /**
   * Validate script path exists on filesystem
   * @param {string} scriptPath - Path to the script file
   * @returns {{ valid: boolean, error?: string }} Validation result
   */
  validateScriptPath (scriptPath) {
    if (!scriptPath || typeof scriptPath !== 'string') {
      return { valid: false, error: 'Script path is required' };
    }
    
    const normalizedPath = path.resolve(scriptPath);
    
    if (!fs.existsSync(normalizedPath)) {
      return { valid: false, error: `Script file not found: ${scriptPath}` };
    }
    
    try {
      const stats = fs.statSync(normalizedPath);
      if (!stats.isFile()) {
        return { valid: false, error: `Path is not a file: ${scriptPath}` };
      }
    } catch (e) {
      return { valid: false, error: `Cannot access script file: ${e.message}` };
    }
    
    return { valid: true };
  }

  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const scriptSet = this._normalizeConfig(options);
    scriptSet.id = id;
    
    // Validate external script path if type is external
    if (scriptSet.type === 'external' && scriptSet.scriptPath) {
      const validation = this.validateScriptPath(scriptSet.scriptPath);
      if (!validation.valid) {
        return { success: false, message: validation.error };
      }
    }
    
    fs.writeFileSync(path.join(__dirname, '../data/script/', id + '.json'), JSON.stringify(scriptSet, null, 2));
    if (global.runningScript[id]) global.runningScript[id].destroy();
    if (scriptSet.enable) global.runningScript[id] = this._createScriptInstance(scriptSet);
    return '添加 Script 成功';
  };

  delete (options) {
    // Delete execution logs for this script
    this._deleteExecutionLogs(options.id);
    
    fs.unlinkSync(path.join(__dirname, '../data/script/', options.id + '.json'));
    if (global.runningScript[options.id]) global.runningScript[options.id].destroy();
    return '删除 Script 成功';
  };

  modify (options) {
    const scriptSet = this._normalizeConfig(options);
    
    // Validate external script path if type is external
    if (scriptSet.type === 'external' && scriptSet.scriptPath) {
      const validation = this.validateScriptPath(scriptSet.scriptPath);
      if (!validation.valid) {
        return { success: false, message: validation.error };
      }
    }
    
    fs.writeFileSync(path.join(__dirname, '../data/script/', options.id + '.json'), JSON.stringify(scriptSet, null, 2));
    if (global.runningScript[options.id]) global.runningScript[options.id].destroy();
    if (scriptSet.enable) global.runningScript[options.id] = this._createScriptInstance(scriptSet);
    return '修改 Script 成功';
  };

  /**
   * Get a script configuration by ID
   * @param {string} id - Script ID
   * @returns {Object|null} Script configuration or null if not found
   */
  get (id) {
    const filePath = path.join(__dirname, '../data/script/', id + '.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      logger.error(`Failed to read script ${id}:`, e);
      return null;
    }
  }

  list () {
    const scriptList = util.listCrontabJavaScript();
    return scriptList;
  };

  /**
   * Run a script manually
   * @param {Object} options - Script options (must include id or script content)
   * @returns {Promise<{ success: boolean, exitCode?: number, stdout?: string, stderr?: string, duration?: number, timedOut?: boolean, error?: string }>}
   */
  async run (options) {
    const startTime = Date.now();
    
    // If options contains an id, load the script configuration
    if (options.id) {
      const scriptConfig = this.get(options.id);
      if (!scriptConfig) {
        return { success: false, error: 'Script not found' };
      }
      
      // Handle external script execution
      if (scriptConfig.type === 'external') {
        try {
          const externalScript = new ExternalScript(scriptConfig);
          const result = await externalScript.execute();
          externalScript.destroy();
          
          const logEntry = {
            timestamp: startTime,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration,
            timedOut: result.timedOut,
            success: result.exitCode === 0
          };
          
          // Store execution log
          this.addExecutionLog(options.id, logEntry);
          
          return {
            success: result.exitCode === 0,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration,
            timedOut: result.timedOut
          };
        } catch (e) {
          logger.error(`External script execution error:`, e);
          
          // Store error log
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 1,
            stdout: '',
            stderr: e.message,
            duration: Date.now() - startTime,
            timedOut: false,
            success: false,
            error: e.message
          });
          
          return { success: false, error: e.message };
        }
      }
      
      // Handle inline script execution
      options = scriptConfig;
    }
    
    // Execute inline script
    if (options.script) {
      try {
        // eslint-disable-next-line no-eval
        const f = eval(options.script);
        await f();
        
        const duration = Date.now() - startTime;
        
        // Store execution log for inline scripts if we have an id
        if (options.id) {
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 0,
            stdout: 'Script executed successfully',
            stderr: '',
            duration,
            timedOut: false,
            success: true
          });
        }
        
        return { success: true, duration };
      } catch (e) {
        logger.error(e);
        
        const duration = Date.now() - startTime;
        
        // Store error log for inline scripts if we have an id
        if (options.id) {
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 1,
            stdout: '',
            stderr: e.message,
            duration,
            timedOut: false,
            success: false,
            error: e.message
          });
        }
        
        return { success: false, error: e.message };
      }
    }
    
    return { success: false, error: 'No script content provided' };
  }
}

module.exports = ScriptMod;
