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
  counterparty_argued: boolean;
  evidence_hash: Buffer;
  id: u64;
  outcome_code: Option<u32>;
  proposer: string;
  proposer_argued: boolean;
  recipient: string;
  respond_by: u64;
  status: CaseStatus;
}

export type Outcome = {tag: "Release", values: void} | {tag: "Refund", values: void} | {tag: "Split", values: void};

export type CaseStatus = {tag: "Open", values: void} | {tag: "Resolved", values: void};

export const ArbitrationError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"DeadlinePassed"},
  5: {message:"AlreadyArgued"},
  6: {message:"InvalidAmount"},
  7: {message:"InvalidDeadline"},
  8: {message:"InsufficientFunds"},
  9: {message:"InvalidOutcome"}
}


export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Case>>>

  /**
   * Construct and simulate a argue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit an off-chain argument digest. Open only until `respond_by`.
   */
  argue: ({caller, case_id, argument_hash}: {caller: string, case_id: u64, argument_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit real funds and open a case linked to an agreement id.
   */
  deposit: ({caller, agreement_id, counterparty, recipient, amount, evidence_hash, respond_by}: {caller: string, agreement_id: u64, counterparty: string, recipient: string, amount: i128, evidence_hash: Buffer, respond_by: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolver publishes and executes the economic outcome. Single-shot.
   */
  resolve: ({caller, case_id, outcome}: {caller: string, case_id: u64, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABENhc2UAAAAMAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADGNvdW50ZXJwYXJ0eQAAABMAAAAAAAAAE2NvdW50ZXJwYXJ0eV9hcmd1ZWQAAAAAAQAAAAAAAAANZXZpZGVuY2VfaGFzaAAAAAAAA+4AAAAgAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAMb3V0Y29tZV9jb2RlAAAD6AAAAAQAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAAPcHJvcG9zZXJfYXJndWVkAAAAAAEAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAACnJlc3BvbmRfYnkAAAAAAAYAAAAAAAAABnN0YXR1cwAAAAAH0AAAAApDYXNlU3RhdHVzAAA=",
        "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAwAAAAAAAAAAAAAAB1JlbGVhc2UAAAAAAAAAAAAAAAAGUmVmdW5kAAAAAAAAAAAAAAAAAAVTcGxpdAAAAA==",
        "AAAAAgAAAAAAAAAAAAAACkNhc2VTdGF0dXMAAAAAAAIAAAAAAAAAAAAAAARPcGVuAAAAAAAAAAAAAAAIUmVzb2x2ZWQ=",
        "AAAABAAAAAAAAAAAAAAAEEFyYml0cmF0aW9uRXJyb3IAAAAJAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAACAAAAAAAAAAxJbnZhbGlkU3RhdGUAAAADAAAAAAAAAA5EZWFkbGluZVBhc3NlZAAAAAAABAAAAAAAAAANQWxyZWFkeUFyZ3VlZAAAAAAAAAUAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAGAAAAAAAAAA9JbnZhbGlkRGVhZGxpbmUAAAAABwAAAAAAAAARSW5zdWZmaWNpZW50RnVuZHMAAAAAAAAIAAAAAAAAAA5JbnZhbGlkT3V0Y29tZQAAAAAACQ==",
        "AAAABQAAAAAAAAAAAAAAEEFyYml0cmF0aW9uRXZlbnQAAAABAAAAEWFyYml0cmF0aW9uX2V2ZW50AAAAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAAAAAABWFjdG9yAAAAAAAAEwAAAAAAAAAC",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAH0AAAAARDYXNlAAAH0AAAABBBcmJpdHJhdGlvbkVycm9y",
        "AAAAAAAAAEJTdWJtaXQgYW4gb2ZmLWNoYWluIGFyZ3VtZW50IGRpZ2VzdC4gT3BlbiBvbmx5IHVudGlsIGByZXNwb25kX2J5YC4AAAAAAAVhcmd1ZQAAAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAAAAAA1hcmd1bWVudF9oYXNoAAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAAEEFyYml0cmF0aW9uRXJyb3I=",
        "AAAAAAAAAD1EZXBvc2l0IHJlYWwgZnVuZHMgYW5kIG9wZW4gYSBjYXNlIGxpbmtlZCB0byBhbiBhZ3JlZW1lbnQgaWQuAAAAAAAAB2RlcG9zaXQAAAAABwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAxjb3VudGVycGFydHkAAAATAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAAAAAAKcmVzcG9uZF9ieQAAAAAABgAAAAEAAAPpAAAABgAAB9AAAAAQQXJiaXRyYXRpb25FcnJvcg==",
        "AAAAAAAAAEJSZXNvbHZlciBwdWJsaXNoZXMgYW5kIGV4ZWN1dGVzIHRoZSBlY29ub21pYyBvdXRjb21lLiBTaW5nbGUtc2hvdC4AAAAAAAdyZXNvbHZlAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAAAAAAdvdXRjb21lAAAAB9AAAAAHT3V0Y29tZQAAAAABAAAD6QAAAAIAAAfQAAAAEEFyYml0cmF0aW9uRXJyb3I=",
        "AAAAAAAAADZQaW4gdGhlIGVzY3JvdyBhc3NldCBhbmQgdGhlIG9ubHkgYXV0aG9yaXplZCByZXNvbHZlci4AAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAgAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAhyZXNvbHZlcgAAABMAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Case>>,
        argue: this.txFromJSON<Result<void>>,
        deposit: this.txFromJSON<Result<u64>>,
        resolve: this.txFromJSON<Result<void>>
  }
}