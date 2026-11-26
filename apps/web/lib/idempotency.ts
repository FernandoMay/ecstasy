/** Small in-memory guard against accidental double submission of a payment. */

export interface IdempotencyRecord {
  hash?: string;
  source?: string;
  at: number;
  pending?: boolean;
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

  remember(key: string, hash: string, now: number = Date.now(), source?: string): void {
    this.records.set(key, { hash, source, at: now, pending: false });
  }

  /** A submit was attempted but its outcome is unknown (timeout / RPC loss). */
  rememberPending(key: string, now: number = Date.now(), source?: string): void {
    this.records.set(key, { source, at: now, pending: true });
  }

  isPending(key: string): boolean {
    return this.records.get(key)?.pending === true;
  }

  sourceOf(key: string): string | undefined {
    return this.records.get(key)?.source;
  }

  /** Convert an unknown outcome into a confirmed one after reconciliation. */
  resolve(key: string, hash: string, now: number = Date.now()): boolean {
    const record = this.records.get(key);
    if (!record || !record.pending) return false;
    this.records.set(key, { ...record, hash, pending: false, at: now });
    return true;
  }

  recordedHash(key: string): string | undefined {
    return this.records.get(key)?.hash;
  }
}
