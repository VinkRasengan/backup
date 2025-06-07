/**
 * Enhanced Logger for FactCheck Application
 * Provides detailed logging for debugging and monitoring
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.enableColors = process.env.NODE_ENV !== 'production';
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        let formattedMessage = `${prefix} ${message}`;
        
        if (data) {
            formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage;
    }

    colorize(text, color) {
        if (!this.enableColors) return text;
        return `${colors[color]}${text}${colors.reset}`;
    }

    info(message, data = null) {
        const formatted = this.formatMessage('info', message, data);
        console.log(this.colorize(formatted, 'blue'));
    }

    success(message, data = null) {
        const formatted = this.formatMessage('success', message, data);
        console.log(this.colorize(formatted, 'green'));
    }

    warn(message, data = null) {
        const formatted = this.formatMessage('warn', message, data);
        console.warn(this.colorize(formatted, 'yellow'));
    }

    error(message, error = null, data = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            ...data
        } : data;
        
        const formatted = this.formatMessage('error', message, errorData);
        console.error(this.colorize(formatted, 'red'));
    }

    debug(message, data = null) {
        if (this.logLevel === 'debug') {
            const formatted = this.formatMessage('debug', message, data);
            console.log(this.colorize(formatted, 'magenta'));
        }
    }

    database(operation, collection, data = null) {
        this.info(`🗄️ Database ${operation}`, {
            collection,
            data: data ? (typeof data === 'object' ? Object.keys(data) : data) : null
        });
    }

    api(method, path, status, duration = null) {
        const statusColor = status >= 400 ? 'red' : status >= 300 ? 'yellow' : 'green';
        const message = `🌐 ${method} ${path} - ${status}${duration ? ` (${duration}ms)` : ''}`;
        
        if (status >= 400) {
            this.error(message);
        } else {
            this.info(message);
        }
    }

    firestore(operation, collection, docId = null, data = null) {
        this.info(`🔥 Firestore ${operation}`, {
            collection,
            document: docId,
            dataKeys: data ? Object.keys(data) : null
        });
    }

    test(testName, result, details = null) {
        const emoji = result ? '✅' : '❌';
        const message = `${emoji} Test: ${testName}`;
        
        if (result) {
            this.success(message, details);
        } else {
            this.error(message, null, details);
        }
    }
}

module.exports = new Logger();
