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





export interface Refund {
  amount: i128;
  counterparty: string;
  created_at: u64;
  id: u64;
  intent_hash: Buffer;
  proposer: string;
  recipient: string;
  status: RefundStatus;
}

export const RefundError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"IntentMismatch"},
  5: {message:"InvalidAmount"},
  6: {message:"InsufficientFunds"}
}


export type RefundStatus = {tag: "Pending", values: void} | {tag: "Approved", values: void} | {tag: "Rejected", values: void} | {tag: "Revoked", values: void} | {tag: "Refunded", values: void};

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({refund_id}: {refund_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Refund>>>

  /**
   * Construct and simulate a reject transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Counterparty rejects: funds return to the proposer, terminal.
   */
  reject: ({caller, refund_id}: {caller: string, refund_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Proposer revokes before approval: funds return, terminal.
   */
  revoke: ({caller, refund_id}: {caller: string, refund_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Counterparty approves the exact same intent that was proposed.
   */
  approve: ({caller, refund_id, intent_hash}: {caller: string, refund_id: u64, intent_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a execute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute the mutual refund: real token transfer to the recipient.
   */
  execute: ({caller, refund_id}: {caller: string, refund_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a propose transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Propose a refund and lock the amount from the proposer into this
   * contract. The counterparty must later approve the same intent digest.
   */
  propose: ({caller, counterparty, recipient, amount, intent_hash}: {caller: string, counterparty: string, recipient: string, amount: i128, intent_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABlJlZnVuZAAAAAAACAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAxjb3VudGVycGFydHkAAAATAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAALaW50ZW50X2hhc2gAAAAD7gAAACAAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAAJcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADFJlZnVuZFN0YXR1cw==",
        "AAAABAAAAAAAAAAAAAAAC1JlZnVuZEVycm9yAAAAAAYAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAADkludGVudE1pc21hdGNoAAAAAAAEAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABQAAAAAAAAARSW5zdWZmaWNpZW50RnVuZHMAAAAAAAAG",
        "AAAABQAAAAAAAAAAAAAAC1JlZnVuZEV2ZW50AAAAAAEAAAAMcmVmdW5kX2V2ZW50AAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAAAAAABWFjdG9yAAAAAAAAEwAAAAAAAAAC",
        "AAAAAgAAAAAAAAAAAAAADFJlZnVuZFN0YXR1cwAAAAUAAAAAAAAAAAAAAAdQZW5kaW5nAAAAAAAAAAAAAAAACEFwcHJvdmVkAAAAAAAAAAAAAAAIUmVqZWN0ZWQAAAAAAAAAAAAAAAdSZXZva2VkAAAAAAAAAAAAAAAACFJlZnVuZGVk",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAACXJlZnVuZF9pZAAAAAAAAAYAAAABAAAD6QAAB9AAAAAGUmVmdW5kAAAAAAfQAAAAC1JlZnVuZEVycm9yAA==",
        "AAAAAAAAAD1Db3VudGVycGFydHkgcmVqZWN0czogZnVuZHMgcmV0dXJuIHRvIHRoZSBwcm9wb3NlciwgdGVybWluYWwuAAAAAAAABnJlamVjdAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAlyZWZ1bmRfaWQAAAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAAtSZWZ1bmRFcnJvcgA=",
        "AAAAAAAAADlQcm9wb3NlciByZXZva2VzIGJlZm9yZSBhcHByb3ZhbDogZnVuZHMgcmV0dXJuLCB0ZXJtaW5hbC4AAAAAAAAGcmV2b2tlAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACXJlZnVuZF9pZAAAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAAC1JlZnVuZEVycm9yAA==",
        "AAAAAAAAAD5Db3VudGVycGFydHkgYXBwcm92ZXMgdGhlIGV4YWN0IHNhbWUgaW50ZW50IHRoYXQgd2FzIHByb3Bvc2VkLgAAAAAAB2FwcHJvdmUAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAlyZWZ1bmRfaWQAAAAAAAAGAAAAAAAAAAtpbnRlbnRfaGFzaAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAALUmVmdW5kRXJyb3IA",
        "AAAAAAAAAEBFeGVjdXRlIHRoZSBtdXR1YWwgcmVmdW5kOiByZWFsIHRva2VuIHRyYW5zZmVyIHRvIHRoZSByZWNpcGllbnQuAAAAB2V4ZWN1dGUAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAlyZWZ1bmRfaWQAAAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAAtSZWZ1bmRFcnJvcgA=",
        "AAAAAAAAAIZQcm9wb3NlIGEgcmVmdW5kIGFuZCBsb2NrIHRoZSBhbW91bnQgZnJvbSB0aGUgcHJvcG9zZXIgaW50byB0aGlzCmNvbnRyYWN0LiBUaGUgY291bnRlcnBhcnR5IG11c3QgbGF0ZXIgYXBwcm92ZSB0aGUgc2FtZSBpbnRlbnQgZGlnZXN0LgAAAAAAB3Byb3Bvc2UAAAAABQAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxjb3VudGVycGFydHkAAAATAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAC2ludGVudF9oYXNoAAAAA+4AAAAgAAAAAQAAA+kAAAAGAAAH0AAAAAtSZWZ1bmRFcnJvcgA=",
        "AAAAAAAAADxQaW5zIHRoZSBzaW5nbGUgU3RlbGxhciBBc3NldCBDb250cmFjdCB1c2VkIGZvciBhbGwgcmVmdW5kcy4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Refund>>,
        reject: this.txFromJSON<Result<void>>,
        revoke: this.txFromJSON<Result<void>>,
        approve: this.txFromJSON<Result<void>>,
        execute: this.txFromJSON<Result<void>>,
        propose: this.txFromJSON<Result<u64>>
  }
}