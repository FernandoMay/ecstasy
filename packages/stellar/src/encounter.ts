/** Domain service: the only place the web app talks to the contract. */

import type { AssembledTransaction, Result } from "@stellar/stellar-sdk/contract";
import type { AppConfig } from "./config";
import { createEcstasyClient, createReadOnlyClient, type EcstasyClient } from "./contract";
import { transactionUrl } from "./explorer";
import type { Encounter, EncounterStatus } from "./generated/ecstasy";
import type { WalletAdapter } from "./wallet";
import { assertWalletIdentity, assertWalletNetwork } from "./wallet";

export interface Receipt {
  hash: string;
  status: string;
  explorerUrl: string;
}

export interface WriteResult<T> {
  value: T;
  receipt: Receipt;
}

export interface CreateEncounterInput {
  creator: string;
  participant: string;
  /** Stake in the asset's smallest unit (e.g. stroops for XLM). */
  stake: bigint;
  /** 32-byte SHA-256 digest of the canonical private terms. */
  termsHash: Uint8Array;
  /** Unix timestamp (seconds) after which the invitation expires. */
  expiresAt: bigint;
}

function errorMessage(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/** Converts SDK results and RPC receipts into the shape the UI renders. */
export class EcstasyService {
  private client: EcstasyClient | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly wallet: WalletAdapter | null,
    private readonly address?: string,
  ) {}

  /** Lazily created so a page can render a clear setup notice before the
   * contract ID is configured, without throwing during static generation. */
  private getClient(): EcstasyClient {
    if (!this.client) {
      this.client =
        this.wallet && this.address
          ? createEcstasyClient(this.config, this.wallet, { address: this.address })
          : createReadOnlyClient(this.config);
    }
    return this.client;
  }

  async read(id: bigint): Promise<Encounter> {
    try {
      const tx = await this.getClient().get_encounter({ encounter_id: id });
      const result = tx.result;
      if (result.isErr()) {
        throw errorMessage(result.unwrapErr());
      }
      return result.unwrap();
    } catch (error) {
      throw errorMessage(error);
    }
  }

  async getAfterglow(id: bigint, participant: string): Promise<number | undefined> {
    const tx = await this.getClient().get_afterglow({
      encounter_id: id,
      participant,
    });
    return tx.result;
  }

  private async send<T>(tx: AssembledTransaction<Result<T>>): Promise<WriteResult<T>> {
    if (!this.wallet) {
      throw new Error("Connect a wallet before sending a transaction");
    }
    // Re-check the wallet network immediately before signing: a wallet may
    // have been switched while the page was open.
    await assertWalletNetwork(this.wallet, this.config.networkPassphrase);
    if (!this.address) {
      throw new Error("Connect a wallet before sending a transaction");
    }
    await assertWalletIdentity(this.wallet, this.address);
    const sent = await tx.signAndSend();
    const result = sent.result;
    if (result.isErr()) {
      throw errorMessage(result.unwrapErr());
    }
    const response = sent.getTransactionResponse;
    const hash = response && "hash" in response ? String(response.hash) : "";
    const status = response && "status" in response ? String(response.status) : "PENDING";
    return {
      value: result.unwrap(),
      receipt: {
        hash,
        status,
        explorerUrl: hash ? transactionUrl(this.config, hash) : "",
      },
    };
  }

  async create(input: CreateEncounterInput): Promise<WriteResult<bigint>> {
    if (input.termsHash.length !== 32) {
      throw new Error("termsHash must be exactly 32 bytes");
    }
    if (input.stake < 0n) {
      throw new Error("stake cannot be negative");
    }
    if (!/^C[A-Z2-7]{55}$/.test(this.config.assetContractId)) {
      throw new Error("NEXT_PUBLIC_ASSET_CONTRACT_ID is not configured for this network");
    }
    // The configured asset is the only asset this deployment supports. It is
    // injected here, never accepted from the caller.
    const asset = this.config.assetContractId;
    const result = await this.send(
      await this.getClient().create_encounter({
        creator: input.creator,
        participant: input.participant,
        asset,
        stake: input.stake,
        terms_hash: Buffer.from(input.termsHash),
        expires_at: input.expiresAt,
      }),
    );
    return result;
  }

  async accept(participant: string, id: bigint): Promise<WriteResult<void>> {
    return this.send(await this.getClient().accept_encounter({ participant, encounter_id: id }));
  }

  async decline(participant: string, id: bigint): Promise<WriteResult<void>> {
    return this.send(await this.getClient().decline_encounter({ participant, encounter_id: id }));
  }

  async complete(caller: string, id: bigint): Promise<WriteResult<void>> {
    return this.send(await this.getClient().complete_encounter({ caller, encounter_id: id }));
  }

  async settle(caller: string, id: bigint): Promise<WriteResult<void>> {
    return this.send(await this.getClient().settle_encounter({ caller, encounter_id: id }));
  }

  async cancel(caller: string, id: bigint): Promise<WriteResult<void>> {
    return this.send(await this.getClient().cancel_encounter({ caller, encounter_id: id }));
  }

  async expire(id: bigint): Promise<WriteResult<void>> {
    return this.send(await this.getClient().expire_encounter({ encounter_id: id }));
  }

  async afterglow(caller: string, id: bigint, score: number): Promise<WriteResult<void>> {
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error("Afterglow score must be an integer from 0 to 100");
    }
    return this.send(
      await this.getClient().submit_afterglow({
        caller,
        encounter_id: id,
        score,
      }),
    );
  }
}

/** Strict parser for the public encounter id used in routes. */
export function parseEncounterId(raw: string): bigint {
  if (!/^\d{1,20}$/.test(raw)) {
    throw new Error("Invalid encounter id");
  }
  const id = BigInt(raw);
  if (id < 1n) {
    throw new Error("Invalid encounter id");
  }
  return id;
}

export function statusName(status: EncounterStatus): string {
  return typeof status === "string" ? status : status.tag;
}
