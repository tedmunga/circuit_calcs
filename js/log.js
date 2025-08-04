const LOG_LEVELS = { 'debug': 0, 'info': 1, 'warn': 2, 'error': 3, 'test': 4, 'off': 5 };
const params = new URLSearchParams(window.location.search);
const currentLogLevel = LOG_LEVELS[params.get('log')?.toLowerCase() || 'info'];

function logger(level, ...args) {
  const levelIndex = LOG_LEVELS[level];
  if (levelIndex >= currentLogLevel) {
    const method = (level === 'debug' || level === 'test') ? 'log' : level;
    console[method](`[${level.toUpperCase()}]`, ...args);
  }
}

console.log("LOG PARAM:", params.get('log'));
console.log("Current log level index:", currentLogLevel);

