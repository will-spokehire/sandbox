const fs = require('fs-extra');
const path = require('path');

/**
 * Core file utilities for reading/writing JSON and CSV files
 */
class FileUtils {
  constructor(baseDir = null) {
    this.baseDir = baseDir || path.join(__dirname, '../../data');
  }

  /**
   * Read and parse JSON file
   * @param {string} filename - Name of the file to read
   * @param {boolean} isArray - Whether the JSON should be treated as array
   * @returns {Promise<Array|Object>} Parsed JSON data
   */
  async readJsonFile(filename, isArray = true) {
    const filePath = path.join(this.baseDir, filename);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      return isArray && !Array.isArray(parsed) ? [parsed] : parsed;
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filename}: ${error.message}`);
    }
  }

  /**
   * Write data to JSON file
   * @param {string} filename - Name of the file to write
   * @param {any} data - Data to write
   * @param {Object} options - Write options
   */
  async writeJsonFile(filename, data, options = {}) {
    const filePath = path.join(this.baseDir, filename);
    const defaultOptions = { spaces: 2, ...options };

    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeJson(filePath, data, defaultOptions);
      console.log(`✅ File written: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write JSON file ${filename}: ${error.message}`);
    }
  }

  /**
   * Read CSV file and parse it
   * @param {string} filename - Name of the CSV file
   * @returns {Promise<Array>} Array of CSV records
   */
  async readCsvFile(filename) {
    const filePath = path.join(this.baseDir, filename);

    return new Promise((resolve, reject) => {
      const records = [];

      fs.createReadStream(filePath)
        .pipe(require('csv-parser')())
        .on('data', (row) => {
          records.push(row);
        })
        .on('end', () => {
          console.log(`📖 Parsed ${records.length} records from CSV: ${filename}`);
          resolve(records);
        })
        .on('error', (error) => {
          console.error('❌ Error parsing CSV:', error);
          reject(error);
        });
    });
  }

  /**
   * Get all files in a directory with a specific extension
   * @param {string} directory - Directory to search
   * @param {string} extension - File extension (e.g., '.json')
   * @returns {Promise<Array>} Array of file paths
   */
  async getFilesByExtension(directory, extension) {
    const searchDir = directory || this.baseDir;
    const files = await fs.readdir(searchDir);
    return files.filter(file => path.extname(file).toLowerCase() === extension.toLowerCase());
  }

  /**
   * Check if file exists
   * @param {string} filename - Name of the file to check
   * @returns {Promise<boolean>} Whether file exists
   */
  async fileExists(filename) {
    const filePath = path.join(this.baseDir, filename);
    return await fs.pathExists(filePath);
  }
}

module.exports = FileUtils;
