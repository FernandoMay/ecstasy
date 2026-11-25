/** Public explorer links for demo evidence. No secrets are ever included. */

import type { AppConfig } from "./config";

export function transactionUrl(config: AppConfig, hash: string): string {
  return `${config.explorerBaseUrl}/tx/${encodeURIComponent(hash)}?chain=${config.network}`;
}

export function contractUrl(config: AppConfig, contractId: string): string {
  return `${config.explorerBaseUrl}/contract/${encodeURIComponent(contractId)}?chain=${config.network}`;
}

export function accountUrl(config: AppConfig, address: string): string {
  return `${config.explorerBaseUrl}/account/${encodeURIComponent(address)}?chain=${config.network}`;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}
