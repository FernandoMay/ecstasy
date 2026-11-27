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




export type Outcome = {tag: "Release", values: void} | {tag: "Refund", values: void};


export interface Agreement {
  agreement_hash: Buffer;
  id: u64;
  milestones: Array<Milestone>;
  proposer: string;
  recipient: string;
  total: i128;
}


export interface Milestone {
  amount: i128;
  deadline: u64;
  dispute_deadline: Option<u64>;
  evidence_hash: Option<Buffer>;
  reason_hash: Option<Buffer>;
  status: MilestoneStatus;
}


export type MilestoneStatus = {tag: "Pending", values: void} | {tag: "Submitted", values: void} | {tag: "Paid", values: void} | {tag: "Disputed", values: void} | {tag: "Refunded", values: void} | {tag: "Recovered", values: void};

export const MilestoneV2Error = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidMilestone"},
  6: {message:"DeadlineNotPassed"},
  7: {message:"AlreadySettled"},
  8: {message:"InsufficientFunds"},
  9: {message:"DisputeNotAllowed"},
  10: {message:"DisputeActive"},
  11: {message:"DeadlinePassed"}
}

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({agreement_id}: {agreement_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Agreement>>>

  /**
   * Construct and simulate a create transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The deposit must equal the exact sum of milestone amounts.
   */
  create: ({caller, recipient, amounts, deadlines, agreement_hash}: {caller: string, recipient: string, amounts: Array<i128>, deadlines: Array<u64>, agreement_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a submit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  submit: ({caller, agreement_id, index, evidence_hash}: {caller: string, agreement_id: u64, index: u32, evidence_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Explicit approval pays only this milestone. Still available before the deadline.
   */
  approve: ({caller, agreement_id, index}: {caller: string, agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  dispute: ({caller, agreement_id, index, reason_hash}: {caller: string, agreement_id: u64, index: u32, reason_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a recover transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * SEC-02 fix: only Pending milestones are recoverable. Disputed and
   * Submitted can never be recovered by a permissionless call.
   */
  recover: ({caller, agreement_id, index}: {caller: string, agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolver decides a disputed milestone, only within the dispute window.
   */
  resolve: ({caller, agreement_id, index, outcome}: {caller: string, agreement_id: u64, index: u32, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a timeout_refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Guaranteed exit for a disputed milestone when the resolver disappears.
   */
  timeout_refund: ({caller, agreement_id, index}: {caller: string, agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a settle_after_deadline transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Legitimate exit for a delivered but unapproved milestone: after its
   * deadline, the recorded delivery is honoured if no dispute was raised.
   */
  settle_after_deadline: ({caller, agreement_id, index}: {caller: string, agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset, resolver}: {asset: string, resolver: string},
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
    return ContractClient.deploy({asset, resolver}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAgAAAAAAAAAAAAAAB1JlbGVhc2UAAAAAAAAAAAAAAAAGUmVmdW5kAAA=",
        "AAAAAQAAAAAAAAAAAAAACUFncmVlbWVudAAAAAAAAAYAAAAAAAAADmFncmVlbWVudF9oYXNoAAAAAAPuAAAAIAAAAAAAAAACaWQAAAAAAAYAAAAAAAAACm1pbGVzdG9uZXMAAAAAA+oAAAfQAAAACU1pbGVzdG9uZQAAAAAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAV0b3RhbAAAAAAAAAs=",
        "AAAAAQAAAAAAAAAAAAAACU1pbGVzdG9uZQAAAAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAAAAABBkaXNwdXRlX2RlYWRsaW5lAAAD6AAAAAYAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPoAAAD7gAAACAAAAAAAAAAC3JlYXNvbl9oYXNoAAAAA+gAAAPuAAAAIAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAD01pbGVzdG9uZVN0YXR1cwA=",
        "AAAABQAAAAAAAAAAAAAADk1pbGVzdG9uZUV2ZW50AAAAAAABAAAAD21pbGVzdG9uZV9ldmVudAAAAAAEAAAAAAAAAARraW5kAAAAEQAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAQAAAAAAAAAFYWN0b3IAAAAAAAATAAAAAAAAAAI=",
        "AAAAAgAAAAAAAAAAAAAAD01pbGVzdG9uZVN0YXR1cwAAAAAGAAAAAAAAAAAAAAAHUGVuZGluZwAAAAAAAAAAAAAAAAlTdWJtaXR0ZWQAAAAAAAAAAAAAAAAAAARQYWlkAAAAAAAAAAAAAAAIRGlzcHV0ZWQAAAAAAAAAAAAAAAhSZWZ1bmRlZAAAAAAAAAAAAAAACVJlY292ZXJlZAAAAA==",
        "AAAABAAAAAAAAAAAAAAAEE1pbGVzdG9uZVYyRXJyb3IAAAALAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAACAAAAAAAAAAxJbnZhbGlkU3RhdGUAAAADAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABAAAAAAAAAAQSW52YWxpZE1pbGVzdG9uZQAAAAUAAAAAAAAAEURlYWRsaW5lTm90UGFzc2VkAAAAAAAABgAAAAAAAAAOQWxyZWFkeVNldHRsZWQAAAAAAAcAAAAAAAAAEUluc3VmZmljaWVudEZ1bmRzAAAAAAAACAAAAAAAAAARRGlzcHV0ZU5vdEFsbG93ZWQAAAAAAAAJAAAAAAAAAA1EaXNwdXRlQWN0aXZlAAAAAAAACgAAAAAAAAAORGVhZGxpbmVQYXNzZWQAAAAAAAs=",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAD6QAAB9AAAAAJQWdyZWVtZW50AAAAAAAH0AAAABBNaWxlc3RvbmVWMkVycm9y",
        "AAAAAAAAADpUaGUgZGVwb3NpdCBtdXN0IGVxdWFsIHRoZSBleGFjdCBzdW0gb2YgbWlsZXN0b25lIGFtb3VudHMuAAAAAAAGY3JlYXRlAAAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAAB2Ftb3VudHMAAAAD6gAAAAsAAAAAAAAACWRlYWRsaW5lcwAAAAAAA+oAAAAGAAAAAAAAAA5hZ3JlZW1lbnRfaGFzaAAAAAAD7gAAACAAAAABAAAD6QAAAAYAAAfQAAAAEE1pbGVzdG9uZVYyRXJyb3I=",
        "AAAAAAAAAAAAAAAGc3VibWl0AAAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAAAAAANZXZpZGVuY2VfaGFzaAAAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAABBNaWxlc3RvbmVWMkVycm9y",
        "AAAAAAAAAFBFeHBsaWNpdCBhcHByb3ZhbCBwYXlzIG9ubHkgdGhpcyBtaWxlc3RvbmUuIFN0aWxsIGF2YWlsYWJsZSBiZWZvcmUgdGhlIGRlYWRsaW5lLgAAAAdhcHByb3ZlAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAQAAA+kAAAACAAAH0AAAABBNaWxlc3RvbmVWMkVycm9y",
        "AAAAAAAAAAAAAAAHZGlzcHV0ZQAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAAAAAALcmVhc29uX2hhc2gAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAAEE1pbGVzdG9uZVYyRXJyb3I=",
        "AAAAAAAAAHxTRUMtMDIgZml4OiBvbmx5IFBlbmRpbmcgbWlsZXN0b25lcyBhcmUgcmVjb3ZlcmFibGUuIERpc3B1dGVkIGFuZApTdWJtaXR0ZWQgY2FuIG5ldmVyIGJlIHJlY292ZXJlZCBieSBhIHBlcm1pc3Npb25sZXNzIGNhbGwuAAAAB3JlY292ZXIAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAD6QAAAAIAAAfQAAAAEE1pbGVzdG9uZVYyRXJyb3I=",
        "AAAAAAAAAEZSZXNvbHZlciBkZWNpZGVzIGEgZGlzcHV0ZWQgbWlsZXN0b25lLCBvbmx5IHdpdGhpbiB0aGUgZGlzcHV0ZSB3aW5kb3cuAAAAAAAHcmVzb2x2ZQAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAAAAAAHb3V0Y29tZQAAAAfQAAAAB091dGNvbWUAAAAAAQAAA+kAAAACAAAH0AAAABBNaWxlc3RvbmVWMkVycm9y",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAIcmVzb2x2ZXIAAAATAAAAAA==",
        "AAAAAAAAAEZHdWFyYW50ZWVkIGV4aXQgZm9yIGEgZGlzcHV0ZWQgbWlsZXN0b25lIHdoZW4gdGhlIHJlc29sdmVyIGRpc2FwcGVhcnMuAAAAAAAOdGltZW91dF9yZWZ1bmQAAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAQAAA+kAAAACAAAH0AAAABBNaWxlc3RvbmVWMkVycm9y",
        "AAAAAAAAAIlMZWdpdGltYXRlIGV4aXQgZm9yIGEgZGVsaXZlcmVkIGJ1dCB1bmFwcHJvdmVkIG1pbGVzdG9uZTogYWZ0ZXIgaXRzCmRlYWRsaW5lLCB0aGUgcmVjb3JkZWQgZGVsaXZlcnkgaXMgaG9ub3VyZWQgaWYgbm8gZGlzcHV0ZSB3YXMgcmFpc2VkLgAAAAAAABVzZXR0bGVfYWZ0ZXJfZGVhZGxpbmUAAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAEAAAPpAAAAAgAAB9AAAAAQTWlsZXN0b25lVjJFcnJvcg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Agreement>>,
        create: this.txFromJSON<Result<u64>>,
        submit: this.txFromJSON<Result<void>>,
        approve: this.txFromJSON<Result<void>>,
        dispute: this.txFromJSON<Result<void>>,
        recover: this.txFromJSON<Result<void>>,
        resolve: this.txFromJSON<Result<void>>,
        timeout_refund: this.txFromJSON<Result<void>>,
        settle_after_deadline: this.txFromJSON<Result<void>>
  }
}