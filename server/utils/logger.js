const isDev = process.env.NODE_ENV !== 'production';

// Never put passwords or tokens in logs
const removeSensitiveData = (data = {}) => {
  const clean = { ...data };
  delete clean.password;
  delete clean.token;
  delete clean.authorization;
  return clean;
};

const log = (level, message, extra = {}) => {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...removeSensitiveData(extra),
  };

  if (isDev) {
    // Easy to read while developing
    console[level === 'info' ? 'log' : level](
      `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`,
      removeSensitiveData(extra)
    );
  } else {
    // JSON format for production
    console[level === 'info' ? 'log' : level](JSON.stringify(entry));
  }
};

const logger = {
  error: (message, extra) => log('error', message, extra),
  warn: (message, extra) => log('warn', message, extra),
  info: (message, extra) => log('info', message, extra),
};

module.exports = { logger };
