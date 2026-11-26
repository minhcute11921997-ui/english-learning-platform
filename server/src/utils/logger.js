const crypto = require('crypto');

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'refreshtoken',
  'accesstoken',
  'token',
  'authorization',
  'cookie',
  'secret'
]);

function redact(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out;
}

function writeLog(level, message, meta = {}) {
  if (process.env.NODE_ENV === 'test') return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta)
  };

  if (process.env.NODE_ENV === 'production') {
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(entry)}` : '';
  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
  if (level === 'error') console.error(`${prefix} ${message}${metaStr}`);
  else if (level === 'warn') console.warn(`${prefix} ${message}${metaStr}`);
  else console.log(`${prefix} ${message}${metaStr}`);
}

const logger = {
  info: (msg, meta) => writeLog('info', msg, meta),
  warn: (msg, meta) => writeLog('warn', msg, meta),
  error: (msg, meta) => writeLog('error', msg, meta),
  http: (msg, meta) => writeLog('http', msg, meta)
};

function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || (
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(8).toString('hex')
  );
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (process.env.NODE_ENV !== 'development') {
      logger.http('http_request', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        ip: req.ip
      });
    }
  });

  next();
}

module.exports = {
  logger,
  requestLogger,
  redact
};
