/** Small in-memory guard against accidental double submission of a payment. */

export interface IdempotencyRecord {
  hash: string;
  at: number;
}

export class IdempotencyGuard {
  private readonly records = new Map<string, IdempotencyRecord>();

  constructor(private readonly windowMs: number = 10 * 60 * 1000) {}

  isValidKey(key: string): boolean {
    return /^[A-Za-z0-9_-]{8,64}$/.test(key);
  }

  isDuplicate(key: string, now: number = Date.now()): boolean {
    const record = this.records.get(key);
    if (!record) return false;
    if (now - record.at >= this.windowMs) {
      this.records.delete(key);
      return false;
    }
    return true;
  }

  remember(key: string, hash: string, now: number = Date.now()): void {
    this.records.set(key, { hash, at: now });
  }

  recordedHash(key: string): string | undefined {
    return this.records.get(key)?.hash;
  }
}
