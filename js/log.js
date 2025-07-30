const LOG_LEVELS = { 'debug': 0, 'info': 1, 'warn': 2, 'error': 3, 'off': 4 };
const params = new URLSearchParams(window.location.search);
const currentLogLevel = LOG_LEVELS[params.get('log')?.toLowerCase() || 'info'];

function log(level, ...args) {
  const levelIndex = LOG_LEVELS[level];
  if (levelIndex >= currentLogLevel) {
    const method = (level === 'debug') ? 'log' : level;
    console[method](`[${level.toUpperCase()}]`, ...args);
  }
}
