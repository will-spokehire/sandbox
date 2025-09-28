/**
 * Consistent logging utility for all scripts
 */
class Logger {
  constructor(scriptName = 'Unknown') {
    this.scriptName = scriptName;
    this.startTime = Date.now();
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {any} data - Optional data to log
   */
  info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ℹ️  ${this.scriptName}: ${message}`);
    if (data) {
      console.log(data);
    }
  }

  /**
   * Log a success message
   * @param {string} message - Message to log
   * @param {any} data - Optional data to log
   */
  success(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ ${this.scriptName}: ${message}`);
    if (data) {
      console.log(data);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {any} data - Optional data to log
   */
  warning(message, data = null) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️  ${this.scriptName}: ${message}`);
    if (data) {
      console.warn(data);
    }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Error} error - Optional error object
   */
  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${this.scriptName}: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  /**
   * Log progress information
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} itemName - Name of items being processed
   */
  progress(current, total, itemName = 'records') {
    const percentage = Math.round((current / total) * 100);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 ${this.scriptName}: Processing ${current}/${total} ${itemName} (${percentage}%)`);
  }

  /**
   * Log completion with timing information
   * @param {string} operation - Operation that completed
   */
  completed(operation = 'Operation') {
    const duration = Date.now() - this.startTime;
    const seconds = Math.round(duration / 1000);
    this.success(`${operation} completed in ${seconds}s`);
  }

  /**
   * Create a section header
   * @param {string} title - Section title
   */
  section(title) {
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 ${this.scriptName}: ${title}`);
    console.log('='.repeat(50));
  }

  /**
   * Create a subsection header
   * @param {string} title - Subsection title
   */
  subsection(title) {
    console.log(`\n📋 ${this.scriptName}: ${title}`);
    console.log('-'.repeat(30));
  }

  /**
   * Log data processing step
   * @param {string} step - Step description
   * @param {number} count - Number of items processed
   */
  step(step, count = null) {
    const message = count ? `${step} (${count} items)` : step;
    this.info(message);
  }

  /**
   * Log file operation
   * @param {string} operation - Operation type (read/write)
   * @param {string} filename - File name
   */
  fileOperation(operation, filename) {
    this.info(`${operation} file: ${filename}`);
  }
}

module.exports = Logger;
