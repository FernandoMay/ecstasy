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





export interface Case {
  agreement_id: u64;
  amount: i128;
  counterparty: string;
  counterparty_evidence: Option<Buffer>;
  id: u64;
  outcome_code: Option<u32>;
  proposer: string;
  proposer_evidence: Option<Buffer>;
  recipient: string;
  resolve_by: u64;
  respond_by: u64;
  status: CaseStatus;
}

export type Outcome = {tag: "Release", values: void} | {tag: "Refund", values: void} | {tag: "Split", values: void};


export type CaseStatus = {tag: "Open", values: void} | {tag: "Resolved", values: void} | {tag: "TimedOut", values: void};

export const ArbitrationV2Error = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidDeadline"},
  6: {message:"DuplicateEvidence"},
  7: {message:"EvidenceDeadlinePassed"},
  8: {message:"TooEarly"},
  9: {message:"InsufficientFunds"}
}

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Case>>>

  /**
   * Construct and simulate a argue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Each party records one evidence digest before `respond_by`.
   */
  argue: ({caller, case_id, argument_hash}: {caller: string, case_id: u64, argument_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit the exact amount and fix both deadlines on-chain.
   */
  deposit: ({caller, agreement_id, counterparty, recipient, amount, respond_by, resolve_by}: {caller: string, agreement_id: u64, counterparty: string, recipient: string, amount: i128, respond_by: u64, resolve_by: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolver decides only between `respond_by` and `resolve_by`.
   */
  resolve: ({caller, case_id, outcome}: {caller: string, case_id: u64, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a timeout transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless deterministic exit after `resolve_by`.
   * The caller has no influence over the outcome.
   */
  timeout: ({caller, case_id}: {caller: string, case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABENhc2UAAAAMAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADGNvdW50ZXJwYXJ0eQAAABMAAAAAAAAAFWNvdW50ZXJwYXJ0eV9ldmlkZW5jZQAAAAAAA+gAAAPuAAAAIAAAAAAAAAACaWQAAAAAAAYAAAAAAAAADG91dGNvbWVfY29kZQAAA+gAAAAEAAAAAAAAAAhwcm9wb3NlcgAAABMAAAAAAAAAEXByb3Bvc2VyX2V2aWRlbmNlAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAApyZXNvbHZlX2J5AAAAAAAGAAAAAAAAAApyZXNwb25kX2J5AAAAAAAGAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAKQ2FzZVN0YXR1cwAA",
        "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAwAAAAAAAAAAAAAAB1JlbGVhc2UAAAAAAAAAAAAAAAAGUmVmdW5kAAAAAAAAAAAAAAAAAAVTcGxpdAAAAA==",
        "AAAABQAAAAAAAAAAAAAACUNhc2VFdmVudAAAAAAAAAEAAAAKY2FzZV9ldmVudAAAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAABAAAAAAAAAAVhY3RvcgAAAAAAABMAAAAAAAAAAg==",
        "AAAAAgAAAAAAAAAAAAAACkNhc2VTdGF0dXMAAAAAAAMAAAAAAAAAAAAAAARPcGVuAAAAAAAAAAAAAAAIUmVzb2x2ZWQAAAAAAAAAAAAAAAhUaW1lZE91dA==",
        "AAAABAAAAAAAAAAAAAAAEkFyYml0cmF0aW9uVjJFcnJvcgAAAAAACQAAAAAAAAAITm90Rm91bmQAAAABAAAAAAAAAA1Ob3RBdXRob3JpemVkAAAAAAAAAgAAAAAAAAAMSW52YWxpZFN0YXRlAAAAAwAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAQAAAAAAAAAD0ludmFsaWREZWFkbGluZQAAAAAFAAAAAAAAABFEdXBsaWNhdGVFdmlkZW5jZQAAAAAAAAYAAAAAAAAAFkV2aWRlbmNlRGVhZGxpbmVQYXNzZWQAAAAAAAcAAAAAAAAACFRvb0Vhcmx5AAAACAAAAAAAAAARSW5zdWZmaWNpZW50RnVuZHMAAAAAAAAJ",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAH0AAAAARDYXNlAAAH0AAAABJBcmJpdHJhdGlvblYyRXJyb3IAAA==",
        "AAAAAAAAADtFYWNoIHBhcnR5IHJlY29yZHMgb25lIGV2aWRlbmNlIGRpZ2VzdCBiZWZvcmUgYHJlc3BvbmRfYnlgLgAAAAAFYXJndWUAAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAANYXJndW1lbnRfaGFzaAAAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAABJBcmJpdHJhdGlvblYyRXJyb3IAAA==",
        "AAAAAAAAADlEZXBvc2l0IHRoZSBleGFjdCBhbW91bnQgYW5kIGZpeCBib3RoIGRlYWRsaW5lcyBvbi1jaGFpbi4AAAAAAAAHZGVwb3NpdAAAAAAHAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAADGNvdW50ZXJwYXJ0eQAAABMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAKcmVzcG9uZF9ieQAAAAAABgAAAAAAAAAKcmVzb2x2ZV9ieQAAAAAABgAAAAEAAAPpAAAABgAAB9AAAAASQXJiaXRyYXRpb25WMkVycm9yAAA=",
        "AAAAAAAAADxSZXNvbHZlciBkZWNpZGVzIG9ubHkgYmV0d2VlbiBgcmVzcG9uZF9ieWAgYW5kIGByZXNvbHZlX2J5YC4AAAAHcmVzb2x2ZQAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAHb3V0Y29tZQAAAAfQAAAAB091dGNvbWUAAAAAAQAAA+kAAAACAAAH0AAAABJBcmJpdHJhdGlvblYyRXJyb3IAAA==",
        "AAAAAAAAAGNQZXJtaXNzaW9ubGVzcyBkZXRlcm1pbmlzdGljIGV4aXQgYWZ0ZXIgYHJlc29sdmVfYnlgLgpUaGUgY2FsbGVyIGhhcyBubyBpbmZsdWVuY2Ugb3ZlciB0aGUgb3V0Y29tZS4AAAAAB3RpbWVvdXQAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAAEkFyYml0cmF0aW9uVjJFcnJvcgAA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAIcmVzb2x2ZXIAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Case>>,
        argue: this.txFromJSON<Result<void>>,
        deposit: this.txFromJSON<Result<u64>>,
        resolve: this.txFromJSON<Result<void>>,
        timeout: this.txFromJSON<Result<void>>
  }
}