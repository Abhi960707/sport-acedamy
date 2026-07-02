const fs = require('fs');
const path = require('path');

const logError = (error, context = '') => {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR ${context ? `[${context}]` : ''}: ${error.message || error}\n${error.stack || ''}\n\n`;
    
    console.error(errorMessage);
    
    // Graceful error logging to a file
    try {
        const logDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(path.join(logDir, 'error.log'), errorMessage);
    } catch (fsError) {
        console.error('Failed to write to error.log', fsError);
    }
};

module.exports = { logError };
