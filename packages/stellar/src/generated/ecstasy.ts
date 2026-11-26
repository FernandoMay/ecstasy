// GENERATED FILE — do not edit by hand.
// Source: contracts/ecstasy (wasm hash
// 4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e)
// Regenerate with: npm run generate:bindings --workspace=@ecstasy/stellar
//
import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





/**
 * Public on-chain state. Never add private terms or personal content here.
 */
export interface Encounter {
  asset: string;
  created_at: u64;
  creator: string;
  creator_completed: boolean;
  expires_at: u64;
  id: u64;
  participant: string;
  participant_completed: boolean;
  /**
 * Deterministic on-chain settlement marker derived from the settlement
 * receipt. This is *not* the Stellar transaction hash; obtain that from
 * the RPC receipt / explorer (see `docs/API.md`).
 */
settlement_marker: Option<Buffer>;
  stake: i128;
  status: EncounterStatus;
  terms_hash: Buffer;
}

/**
 * Contract errors. Numeric codes are part of the ABI and must stay stable.
 */
export const EcstasyError = {
  1: {message:"NotFound"},
  2: {message:"NotParty"},
  3: {message:"SelfEncounter"},
  4: {message:"InvalidStake"},
  5: {message:"InvalidExpiry"},
  6: {message:"InvalidState"},
  7: {message:"InvalidScore"},
  8: {message:"AlreadyCompleted"},
  9: {message:"AlreadySubmitted"},
  10: {message:"Expired"},
  11: {message:"InvalidAsset"}
}


/**
 * Lifecycle of an encounter.
 * 
 * `Created` is the pending invitation. There is no separate `INVITED` or
 * `ACTIVE` state in the MVP: `create_encounter` emits the invitation and
 * `accept_encounter` moves directly to `Accepted`.
 */
export type EncounterStatus = {tag: "Created", values: void} | {tag: "Accepted", values: void} | {tag: "Completed", values: void} | {tag: "Settled", values: void} | {tag: "Cancelled", values: void} | {tag: "Expired", values: void};

export interface Client {
  /**
   * Construct and simulate a retirar transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw funds sent to the contract that are not reserved as escrow
   * for any encounter. Only the creator of the referenced encounter may
   * call it, and only the surplus above `ReservedStake` is transferred.
   * This is a real value-moving state transition with an event; it cannot
   * drain locked stakes. Returns the amount withdrawn.
   */
  retirar: ({caller, encounter_id}: {caller: string, encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_afterglow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Public read of one participant's afterglow, if submitted.
   */
  get_afterglow: ({encounter_id, participant}: {encounter_id: u64, participant: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<u32>>>

  /**
   * Construct and simulate a get_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Public read. Expiry is derived so a stale stored state is reported
   * correctly even before a transaction touches the encounter.
   */
  get_encounter: ({encounter_id}: {encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Encounter>>>

  /**
   * Construct and simulate a accept_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Explicit consent by the invited participant.
   */
  accept_encounter: ({participant, encounter_id}: {participant: string, encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a still-open encounter and refund the creator. Either party may
   * withdraw consent before completion; after completion, only settlement
   * is possible.
   */
  cancel_encounter: ({caller, encounter_id}: {caller: string, encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create an invitation and optionally pull the creator's stake into
   * escrow. Returns the monotonically increasing encounter id.
   */
  create_encounter: ({creator, participant, asset, stake, terms_hash, expires_at}: {creator: string, participant: string, asset: string, stake: i128, terms_hash: Buffer, expires_at: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a expire_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless finalization of an expired encounter. Anyone may call
   * it: the refund always goes back to the creator, never to the caller.
   * A failed invocation would roll back the refund, so expiry is committed
   * in this successful, idempotent-on-terminal-state transition.
   */
  expire_encounter: ({encounter_id}: {encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a settle_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Terminal transition: release escrow to the participant, attach a
   * deterministic receipt marker, and prevent any further state change.
   */
  settle_encounter: ({caller, encounter_id}: {caller: string, encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit_afterglow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One bounded afterglow score (0..=100) per participant, only after
   * settlement. Reputation metadata, not a truth or safety claim.
   */
  submit_afterglow: ({caller, encounter_id, score}: {caller: string, encounter_id: u64, score: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a decline_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Decline the invitation. Always refunds the creator.
   */
  decline_encounter: ({participant, encounter_id}: {participant: string, encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a complete_encounter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record one party's completion. Both parties must call this before the
   * encounter can be settled. Calling twice by the same party is rejected.
   */
  complete_encounter: ({caller, encounter_id}: {caller: string, encounter_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset}: {asset: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({asset}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAEhQdWJsaWMgb24tY2hhaW4gc3RhdGUuIE5ldmVyIGFkZCBwcml2YXRlIHRlcm1zIG9yIHBlcnNvbmFsIGNvbnRlbnQgaGVyZS4AAAAAAAAACUVuY291bnRlcgAAAAAAAAwAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAABFjcmVhdG9yX2NvbXBsZXRlZAAAAAAAAAEAAAAAAAAACmV4cGlyZXNfYXQAAAAAAAYAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAtwYXJ0aWNpcGFudAAAAAATAAAAAAAAABVwYXJ0aWNpcGFudF9jb21wbGV0ZWQAAAAAAAABAAAAukRldGVybWluaXN0aWMgb24tY2hhaW4gc2V0dGxlbWVudCBtYXJrZXIgZGVyaXZlZCBmcm9tIHRoZSBzZXR0bGVtZW50CnJlY2VpcHQuIFRoaXMgaXMgKm5vdCogdGhlIFN0ZWxsYXIgdHJhbnNhY3Rpb24gaGFzaDsgb2J0YWluIHRoYXQgZnJvbQp0aGUgUlBDIHJlY2VpcHQgLyBleHBsb3JlciAoc2VlIGBkb2NzL0FQSS5tZGApLgAAAAAAEXNldHRsZW1lbnRfbWFya2VyAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAVzdGFrZQAAAAAAAAsAAAAAAAAABnN0YXR1cwAAAAAH0AAAAA9FbmNvdW50ZXJTdGF0dXMAAAAAAAAAAAp0ZXJtc19oYXNoAAAAAAPuAAAAIA==",
        "AAAABAAAAEhDb250cmFjdCBlcnJvcnMuIE51bWVyaWMgY29kZXMgYXJlIHBhcnQgb2YgdGhlIEFCSSBhbmQgbXVzdCBzdGF5IHN0YWJsZS4AAAAAAAAADEVjc3Rhc3lFcnJvcgAAAAsAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAAITm90UGFydHkAAAACAAAAAAAAAA1TZWxmRW5jb3VudGVyAAAAAAAAAwAAAAAAAAAMSW52YWxpZFN0YWtlAAAABAAAAAAAAAANSW52YWxpZEV4cGlyeQAAAAAAAAUAAAAAAAAADEludmFsaWRTdGF0ZQAAAAYAAAAAAAAADEludmFsaWRTY29yZQAAAAcAAAAAAAAAEEFscmVhZHlDb21wbGV0ZWQAAAAIAAAAAAAAABBBbHJlYWR5U3VibWl0dGVkAAAACQAAAAAAAAAHRXhwaXJlZAAAAAAKAAAAAAAAAAxJbnZhbGlkQXNzZXQAAAAL",
        "AAAABQAAAHFFdmVyeSBzdGF0ZSB0cmFuc2l0aW9uIGVtaXRzIHRoaXMgdHlwZWQgZXZlbnQuClRvcGljczogYCgiZWNzdGFzeSIsIGlkLCBuYW1lKWAsIGRhdGE6IGB7IHN0YXR1cywgc3Rha2UsIGFjdG9yIH1gLgAAAAAAAAAAAAAORW5jb3VudGVyRXZlbnQAAAAAAAEAAAAHZWNzdGFzeQAAAAAFAAAAAAAAAAJpZAAAAAAABgAAAAEAAAAAAAAABG5hbWUAAAARAAAAAQAAAAAAAAAGc3RhdHVzAAAAAAARAAAAAAAAAAAAAAAFc3Rha2UAAAAAAAALAAAAAAAAAAAAAAAFYWN0b3IAAAAAAAATAAAAAAAAAAI=",
        "AAAAAgAAANpMaWZlY3ljbGUgb2YgYW4gZW5jb3VudGVyLgoKYENyZWF0ZWRgIGlzIHRoZSBwZW5kaW5nIGludml0YXRpb24uIFRoZXJlIGlzIG5vIHNlcGFyYXRlIGBJTlZJVEVEYCBvcgpgQUNUSVZFYCBzdGF0ZSBpbiB0aGUgTVZQOiBgY3JlYXRlX2VuY291bnRlcmAgZW1pdHMgdGhlIGludml0YXRpb24gYW5kCmBhY2NlcHRfZW5jb3VudGVyYCBtb3ZlcyBkaXJlY3RseSB0byBgQWNjZXB0ZWRgLgAAAAAAAAAAAA9FbmNvdW50ZXJTdGF0dXMAAAAABgAAAAAAAAAAAAAAB0NyZWF0ZWQAAAAAAAAAAAAAAAAIQWNjZXB0ZWQAAAAAAAAAAAAAAAlDb21wbGV0ZWQAAAAAAAAAAAAAAAAAAAdTZXR0bGVkAAAAAAAAAAAAAAAACUNhbmNlbGxlZAAAAAAAAAAAAAAAAAAAB0V4cGlyZWQA",
        "AAAAAAAAAURXaXRoZHJhdyBmdW5kcyBzZW50IHRvIHRoZSBjb250cmFjdCB0aGF0IGFyZSBub3QgcmVzZXJ2ZWQgYXMgZXNjcm93CmZvciBhbnkgZW5jb3VudGVyLiBPbmx5IHRoZSBjcmVhdG9yIG9mIHRoZSByZWZlcmVuY2VkIGVuY291bnRlciBtYXkKY2FsbCBpdCwgYW5kIG9ubHkgdGhlIHN1cnBsdXMgYWJvdmUgYFJlc2VydmVkU3Rha2VgIGlzIHRyYW5zZmVycmVkLgpUaGlzIGlzIGEgcmVhbCB2YWx1ZS1tb3Zpbmcgc3RhdGUgdHJhbnNpdGlvbiB3aXRoIGFuIGV2ZW50OyBpdCBjYW5ub3QKZHJhaW4gbG9ja2VkIHN0YWtlcy4gUmV0dXJucyB0aGUgYW1vdW50IHdpdGhkcmF3bi4AAAAHcmV0aXJhcgAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGVuY291bnRlcl9pZAAAAAYAAAABAAAD6QAAAAsAAAfQAAAADEVjc3Rhc3lFcnJvcg==",
        "AAAAAAAAAHpUaGUgc2luZ2xlIGVzY3JvdyBhc3NldCBpcyBmaXhlZCBhdCBkZXBsb3ltZW50IHRpbWUuIE5vIGVuY291bnRlciBjYW4KdXNlIGEgZGlmZmVyZW50IGFzc2V0LCBpbmNsdWRpbmcgdGhlIHZlcnkgZmlyc3Qgb25lLgAAAAAADV9fY29uc3RydWN0b3IAAAAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAAA",
        "AAAAAAAAADlQdWJsaWMgcmVhZCBvZiBvbmUgcGFydGljaXBhbnQncyBhZnRlcmdsb3csIGlmIHN1Ym1pdHRlZC4AAAAAAAANZ2V0X2FmdGVyZ2xvdwAAAAAAAAIAAAAAAAAADGVuY291bnRlcl9pZAAAAAYAAAAAAAAAC3BhcnRpY2lwYW50AAAAABMAAAABAAAD6AAAAAQ=",
        "AAAAAAAAAH1QdWJsaWMgcmVhZC4gRXhwaXJ5IGlzIGRlcml2ZWQgc28gYSBzdGFsZSBzdG9yZWQgc3RhdGUgaXMgcmVwb3J0ZWQKY29ycmVjdGx5IGV2ZW4gYmVmb3JlIGEgdHJhbnNhY3Rpb24gdG91Y2hlcyB0aGUgZW5jb3VudGVyLgAAAAAAAA1nZXRfZW5jb3VudGVyAAAAAAAAAQAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAH0AAAAAlFbmNvdW50ZXIAAAAAAAfQAAAADEVjc3Rhc3lFcnJvcg==",
        "AAAAAAAAACxFeHBsaWNpdCBjb25zZW50IGJ5IHRoZSBpbnZpdGVkIHBhcnRpY2lwYW50LgAAABBhY2NlcHRfZW5jb3VudGVyAAAAAgAAAAAAAAALcGFydGljaXBhbnQAAAAAEwAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMRWNzdGFzeUVycm9y",
        "AAAAAAAAAJlDYW5jZWwgYSBzdGlsbC1vcGVuIGVuY291bnRlciBhbmQgcmVmdW5kIHRoZSBjcmVhdG9yLiBFaXRoZXIgcGFydHkgbWF5CndpdGhkcmF3IGNvbnNlbnQgYmVmb3JlIGNvbXBsZXRpb247IGFmdGVyIGNvbXBsZXRpb24sIG9ubHkgc2V0dGxlbWVudAppcyBwb3NzaWJsZS4AAAAAAAAQY2FuY2VsX2VuY291bnRlcgAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMRWNzdGFzeUVycm9y",
        "AAAAAAAAAHxDcmVhdGUgYW4gaW52aXRhdGlvbiBhbmQgb3B0aW9uYWxseSBwdWxsIHRoZSBjcmVhdG9yJ3Mgc3Rha2UgaW50bwplc2Nyb3cuIFJldHVybnMgdGhlIG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyBlbmNvdW50ZXIgaWQuAAAAEGNyZWF0ZV9lbmNvdW50ZXIAAAAGAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAC3BhcnRpY2lwYW50AAAAABMAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAFc3Rha2UAAAAAAAALAAAAAAAAAAp0ZXJtc19oYXNoAAAAAAPuAAAAIAAAAAAAAAAKZXhwaXJlc19hdAAAAAAABgAAAAEAAAPpAAAABgAAB9AAAAAMRWNzdGFzeUVycm9y",
        "AAAAAAAAAQ1QZXJtaXNzaW9ubGVzcyBmaW5hbGl6YXRpb24gb2YgYW4gZXhwaXJlZCBlbmNvdW50ZXIuIEFueW9uZSBtYXkgY2FsbAppdDogdGhlIHJlZnVuZCBhbHdheXMgZ29lcyBiYWNrIHRvIHRoZSBjcmVhdG9yLCBuZXZlciB0byB0aGUgY2FsbGVyLgpBIGZhaWxlZCBpbnZvY2F0aW9uIHdvdWxkIHJvbGwgYmFjayB0aGUgcmVmdW5kLCBzbyBleHBpcnkgaXMgY29tbWl0dGVkCmluIHRoaXMgc3VjY2Vzc2Z1bCwgaWRlbXBvdGVudC1vbi10ZXJtaW5hbC1zdGF0ZSB0cmFuc2l0aW9uLgAAAAAAABBleHBpcmVfZW5jb3VudGVyAAAAAQAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMRWNzdGFzeUVycm9y",
        "AAAAAAAAAIRUZXJtaW5hbCB0cmFuc2l0aW9uOiByZWxlYXNlIGVzY3JvdyB0byB0aGUgcGFydGljaXBhbnQsIGF0dGFjaCBhCmRldGVybWluaXN0aWMgcmVjZWlwdCBtYXJrZXIsIGFuZCBwcmV2ZW50IGFueSBmdXJ0aGVyIHN0YXRlIGNoYW5nZS4AAAAQc2V0dGxlX2VuY291bnRlcgAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMRWNzdGFzeUVycm9y",
        "AAAAAAAAAH9PbmUgYm91bmRlZCBhZnRlcmdsb3cgc2NvcmUgKDAuLj0xMDApIHBlciBwYXJ0aWNpcGFudCwgb25seSBhZnRlcgpzZXR0bGVtZW50LiBSZXB1dGF0aW9uIG1ldGFkYXRhLCBub3QgYSB0cnV0aCBvciBzYWZldHkgY2xhaW0uAAAAABBzdWJtaXRfYWZ0ZXJnbG93AAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxlbmNvdW50ZXJfaWQAAAAGAAAAAAAAAAVzY29yZQAAAAAAAAQAAAABAAAD6QAAAAIAAAfQAAAADEVjc3Rhc3lFcnJvcg==",
        "AAAAAAAAADNEZWNsaW5lIHRoZSBpbnZpdGF0aW9uLiBBbHdheXMgcmVmdW5kcyB0aGUgY3JlYXRvci4AAAAAEWRlY2xpbmVfZW5jb3VudGVyAAAAAAAAAgAAAAAAAAALcGFydGljaXBhbnQAAAAAEwAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMRWNzdGFzeUVycm9y",
        "AAAAAAAAAIxSZWNvcmQgb25lIHBhcnR5J3MgY29tcGxldGlvbi4gQm90aCBwYXJ0aWVzIG11c3QgY2FsbCB0aGlzIGJlZm9yZSB0aGUKZW5jb3VudGVyIGNhbiBiZSBzZXR0bGVkLiBDYWxsaW5nIHR3aWNlIGJ5IHRoZSBzYW1lIHBhcnR5IGlzIHJlamVjdGVkLgAAABJjb21wbGV0ZV9lbmNvdW50ZXIAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMZW5jb3VudGVyX2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMRWNzdGFzeUVycm9y" ]),
      options
    )
  }
  public readonly fromJSON = {
    retirar: this.txFromJSON<Result<i128>>,
        get_afterglow: this.txFromJSON<Option<u32>>,
        get_encounter: this.txFromJSON<Result<Encounter>>,
        accept_encounter: this.txFromJSON<Result<void>>,
        cancel_encounter: this.txFromJSON<Result<void>>,
        create_encounter: this.txFromJSON<Result<u64>>,
        expire_encounter: this.txFromJSON<Result<void>>,
        settle_encounter: this.txFromJSON<Result<void>>,
        submit_afterglow: this.txFromJSON<Result<void>>,
        decline_encounter: this.txFromJSON<Result<void>>,
        complete_encounter: this.txFromJSON<Result<void>>
  }
}