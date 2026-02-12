/**
 * File utility functions for safe writes
 */

const fs = require('fs');
const path = require('path');

/**
 * Atomically writes data to a file by writing to temp then renaming
 * @param {string} filePath - Target file path
 * @param {string|object} data - Data to write (string or JSON object)
 * @param {boolean} json - If true, data will be JSON.stringify'd
 */
function atomicWrite(filePath, data, json = false) {
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.${Date.now()}.tmp`;

  try {
    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });

    // Write to temporary file
    const content = json ? JSON.stringify(data, null, 2) : data;
    fs.writeFileSync(tempPath, content, { encoding: 'utf8' });

    // Atomic rename (posix rename is atomic on same filesystem)
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    // Cleanup temp file on error
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Safely reads JSON file with optional default
 */
function readJson(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return defaultValue;
  }
}

module.exports = { atomicWrite, readJson };