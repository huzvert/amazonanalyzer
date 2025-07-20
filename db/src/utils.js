const readline = require('readline');
const fs = require('fs').promises;

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promise wrapper for getting user input
function getUserInput(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (input) => {
            resolve(input);
        });
    });
}

/**
 * Creates an Amazon search URL for a given keyword
 * @param {string} keyword - The search term
 * @returns {string} - Formatted Amazon search URL
 */
function getSearchUrl(keyword) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
}

/**
 * Ensures a directory exists
 * @param {string} dirPath - Directory path
 */
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
}

module.exports = {
    rl,
    getUserInput,
    getSearchUrl,
    ensureDirectoryExists
};