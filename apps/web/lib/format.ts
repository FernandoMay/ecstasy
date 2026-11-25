export function formatDistanceToNowStrict(target: number, now = Date.now()): string {
  const delta = target - now;
  const sign = delta < 0 ? "ago" : "from now";
  let seconds = Math.abs(Math.floor(delta / 1000));
  const days = Math.floor(seconds / 86_400);
  seconds -= days * 86_400;
  const hours = Math.floor(seconds / 3_600);
  seconds -= hours * 3_600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${seconds}s`);
  return `${parts.join(" ")} ${sign}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

/** Exact decimal-string conversion, avoiding floating point rounding. */
export function xlmToStroops(input: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(input.trim());
  if (!match) throw new Error("Enter a non-negative amount with up to 7 decimals");
  const whole = BigInt(match[1] ?? "0") * 10_000_000n;
  const fraction = BigInt((match[2] ?? "").padEnd(7, "0") || "0");
  return whole + fraction;
}
