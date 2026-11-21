const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function rawPixelsToDHash(raw) {
  let bits = 0n;
  for (let row = 0; row < 8; row += 1) {
    const offset = row * 9;
    for (let col = 0; col < 8; col += 1) {
      bits = (bits << 1n) | (raw[offset + col] > raw[offset + col + 1] ? 1n : 0n);
    }
  }
  return bits;
}

/**
 * Compute 64-bit difference hash (dHash) using 9x8 grayscale thumbnail.
 * Allows near-duplicate images (recompressed JPEG, slight resize) to hit cache.
 */
async function computeDHash(buffer) {
  const raw = await sharp(buffer)
    .greyscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer();
  return rawPixelsToDHash(raw);
}

function hammingDistance(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

function findInFlightByDHash(inFlightMap, dhash, maxDist = 2) {
  if (dhash === null || dhash === undefined) return null;
  for (const entry of inFlightMap.values()) {
    if (entry?.dhash !== null && entry?.dhash !== undefined && hammingDistance(dhash, entry.dhash) <= maxDist) {
      return entry;
    }
  }
  return null;
}

/**
 * Persistent LRU + Perceptual Hash Cache backed by an atomic JSON snapshot on disk.
 * Survives server restarts without requiring native SQLite compilation.
 */
class PersistentVisionCache {
  constructor({
    maxEntries = 1000,
    ttlMs = 30 * 60 * 1000,
    persistPath = null,
    dhashMaxDistance = 3
  } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.persistPath = persistPath;
    this.dhashMaxDistance = dhashMaxDistance;
    this.map = new Map();
    this._saveTimer = null;

    if (this.persistPath) {
      this._loadSync();
    }
  }

  _loadSync() {
    try {
      if (!fs.existsSync(this.persistPath)) return;
      const raw = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
      const now = Date.now();
      for (const item of raw.entries || []) {
        if (this.ttlMs > 0 && now - item.ts > this.ttlMs) continue;
        this.map.set(item.hash, {
          value: item.value,
          ts: item.ts,
          dhash: item.dhash ? BigInt(item.dhash) : null
        });
      }
    } catch {
      // Ignore corrupt cache file and start fresh
    }
  }

  _scheduleSave() {
    if (!this.persistPath || this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this.flushSync();
    }, 500);
    if (typeof this._saveTimer.unref === 'function') {
      this._saveTimer.unref();
    }
  }

  flushSync() {
    if (!this.persistPath) return;
    try {
      fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
      const entries = [];
      for (const [hash, entry] of this.map.entries()) {
        entries.push({
          hash,
          ts: entry.ts,
          dhash: entry.dhash !== null && entry.dhash !== undefined ? entry.dhash.toString() : null,
          value: entry.value
        });
      }
      const tmp = `${this.persistPath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ entries }), 'utf8');
      fs.renameSync(tmp, this.persistPath);
    } catch {
      // Non-fatal disk cache write error
    }
  }

  _isExpired(entry) {
    return this.ttlMs > 0 && Date.now() - entry.ts > this.ttlMs;
  }

  get(hash, dhash = null) {
    const exact = this.map.get(hash);
    if (exact) {
      if (this._isExpired(exact)) {
        this.map.delete(hash);
      } else {
        this.map.delete(hash);
        this.map.set(hash, exact);
        return { value: exact.value, matchType: 'sha256' };
      }
    }

    if (dhash !== null && dhash !== undefined) {
      for (const [k, entry] of this.map.entries()) {
        if (this._isExpired(entry)) {
          this.map.delete(k);
          continue;
        }
        if (entry.dhash !== null && hammingDistance(dhash, entry.dhash) <= this.dhashMaxDistance) {
          this.map.delete(k);
          this.map.set(k, entry);
          return { value: entry.value, matchType: 'phash' };
        }
      }
    }
    return undefined;
  }

  set(hash, value, dhash = null) {
    if (this.map.has(hash)) {
      this.map.delete(hash);
    } else if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(hash, { value, ts: Date.now(), dhash });
    this._scheduleSave();
  }

  clear() {
    this.map.clear();
    if (this.persistPath && fs.existsSync(this.persistPath)) {
      try {
        fs.unlinkSync(this.persistPath);
      } catch {
        // ignore
      }
    }
  }

  get size() {
    return this.map.size;
  }
}

module.exports = {
  PersistentVisionCache,
  computeDHash,
  rawPixelsToDHash,
  hammingDistance,
  findInFlightByDHash
};
