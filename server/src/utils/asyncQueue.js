/**
 * Bounded concurrency queue + LRU Cache + In-flight deduplication
 * Keeps local GPU inference predictable and prevents OOM / timeout cascades under load.
 */

class QueueFullError extends Error {
  constructor(message = 'Hệ thống AI đang bận xử lý nhiều ảnh. Vui lòng thử lại sau vài giây.', retryAfterSec = 3) {
    super(message);
    this.name = 'QueueFullError';
    this.statusCode = 429;
    this.retryAfterSec = retryAfterSec;
  }
}

class QueueTimeoutError extends Error {
  constructor(message = 'Xử lý AI vượt quá thời gian chờ.') {
    super(message);
    this.name = 'QueueTimeoutError';
    this.statusCode = 504;
  }
}

class BoundedAsyncQueue {
  /**
   * @param {object} opts
   * @param {number} opts.concurrency - Maximum concurrent tasks
   * @param {number} opts.maxQueueSize - Maximum waiting tasks in queue
   * @param {number} opts.retryAfterSec - Suggested Retry-After header when full
   */
  constructor({ concurrency = 2, maxQueueSize = 20, retryAfterSec = 3 } = {}) {
    this.concurrency = concurrency;
    this.maxQueueSize = maxQueueSize;
    this.retryAfterSec = retryAfterSec;
    this.active = 0;
    this.pending = [];
  }

  get size() {
    return this.pending.length;
  }

  get activeCount() {
    return this.active;
  }

  /**
   * Enqueue a task with optional execution timeout.
   * Rejects immediately with QueueFullError if waiting queue is saturated.
   */
  run(taskFn, timeoutMs = 0) {
    if (this.active >= this.concurrency && this.pending.length >= this.maxQueueSize) {
      return Promise.reject(new QueueFullError(undefined, this.retryAfterSec));
    }

    return new Promise((resolve, reject) => {
      const item = { taskFn, resolve, reject, settled: false, timer: null };

      if (timeoutMs > 0) {
        item.timer = setTimeout(() => {
          if (item.settled) return;
          item.settled = true;
          const idx = this.pending.indexOf(item);
          if (idx !== -1) this.pending.splice(idx, 1);
          reject(new QueueTimeoutError());
        }, timeoutMs);
      }

      this.pending.push(item);
      this._drain();
    });
  }

  _drain() {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const item = this.pending.shift();
      if (!item || item.settled) continue;

      this.active += 1;
      Promise.resolve()
        .then(() => item.taskFn())
        .then((res) => {
          if (!item.settled) {
            item.settled = true;
            if (item.timer) clearTimeout(item.timer);
            item.resolve(res);
          }
        })
        .catch((err) => {
          if (!item.settled) {
            item.settled = true;
            if (item.timer) clearTimeout(item.timer);
            item.reject(err);
          }
        })
        .finally(() => {
          this.active -= 1;
          this._drain();
        });
    }
  }
}

class LruCache {
  constructor(maxEntries = 1000, ttlMs = 30 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs > 0 && Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, { value, ts: Date.now() });
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}

module.exports = {
  BoundedAsyncQueue,
  LruCache,
  QueueFullError,
  QueueTimeoutError
};
