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





export interface Stream {
  deposit: i128;
  duration: u64;
  id: u64;
  paused_at: Option<u64>;
  paused_total: u64;
  payer: string;
  rate: i128;
  recipient: string;
  start: u64;
  status: StreamStatus;
  withdrawn: i128;
}

export const StreamError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidDuration"},
  6: {message:"NothingToClaim"},
  7: {message:"InsufficientFunds"}
}


export type StreamStatus = {tag: "Active", values: void} | {tag: "Paused", values: void} | {tag: "Cancelled", values: void} | {tag: "Closed", values: void};

export interface Client {
  /**
   * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Recipient withdraws accrued-but-unclaimed stroops. Repeated claims
   * within the same interval return `NothingToClaim` (#6).
   */
  claim: ({caller, stream_id}: {caller: string, stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a close transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless close of a fully vested stream. Terminal.
   */
  close: ({caller, stream_id}: {caller: string, stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Payer freezes accrual. The stream clock stops at the pause timestamp.
   */
  pause: ({caller, stream_id}: {caller: string, stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Either party ends the stream: accrued stroops go to the recipient,
   * the untouched remainder returns to the payer. Terminal.
   */
  cancel: ({caller, stream_id}: {caller: string, stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resume transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Payer restarts accrual, accounting for every paused second.
   */
  resume: ({caller, stream_id}: {caller: string, stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claimable transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Currently claimable stroops, computed from ledger time only.
   */
  claimable: ({stream_id}: {stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_stream transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_stream: ({stream_id}: {stream_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Stream>>>

  /**
   * Construct and simulate a create_stream transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit real XLM. `deposit == rate * duration` is required so the
   * stream can never strand or overdraw stroops.
   */
  create_stream: ({caller, recipient, deposit, rate, duration}: {caller: string, recipient: string, deposit: i128, rate: i128, duration: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABlN0cmVhbQAAAAAACwAAAAAAAAAHZGVwb3NpdAAAAAALAAAAAAAAAAhkdXJhdGlvbgAAAAYAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAlwYXVzZWRfYXQAAAAAAAPoAAAABgAAAAAAAAAMcGF1c2VkX3RvdGFsAAAABgAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAAAAAARyYXRlAAAACwAAAAAAAAAJcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAFc3RhcnQAAAAAAAAGAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAMU3RyZWFtU3RhdHVzAAAAAAAAAAl3aXRoZHJhd24AAAAAAAAL",
        "AAAABAAAAAAAAAAAAAAAC1N0cmVhbUVycm9yAAAAAAcAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAEAAAAAAAAAA9JbnZhbGlkRHVyYXRpb24AAAAABQAAAAAAAAAOTm90aGluZ1RvQ2xhaW0AAAAAAAYAAAAAAAAAEUluc3VmZmljaWVudEZ1bmRzAAAAAAAABw==",
        "AAAABQAAAAAAAAAAAAAAC1N0cmVhbUV2ZW50AAAAAAEAAAAMc3RyZWFtX2V2ZW50AAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAJpZAAAAAAABgAAAAEAAAAAAAAABWFjdG9yAAAAAAAAEwAAAAAAAAAC",
        "AAAAAgAAAAAAAAAAAAAADFN0cmVhbVN0YXR1cwAAAAQAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAABlBhdXNlZAAAAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAAAAAAAAAAAAAAAAAGQ2xvc2VkAAA=",
        "AAAAAAAAAHlSZWNpcGllbnQgd2l0aGRyYXdzIGFjY3J1ZWQtYnV0LXVuY2xhaW1lZCBzdHJvb3BzLiBSZXBlYXRlZCBjbGFpbXMKd2l0aGluIHRoZSBzYW1lIGludGVydmFsIHJldHVybiBgTm90aGluZ1RvQ2xhaW1gICgjNikuAAAAAAAABWNsYWltAAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAlzdHJlYW1faWQAAAAAAAAGAAAAAQAAA+kAAAALAAAH0AAAAAtTdHJlYW1FcnJvcgA=",
        "AAAAAAAAADhQZXJtaXNzaW9ubGVzcyBjbG9zZSBvZiBhIGZ1bGx5IHZlc3RlZCBzdHJlYW0uIFRlcm1pbmFsLgAAAAVjbG9zZQAAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJc3RyZWFtX2lkAAAAAAAABgAAAAEAAAPpAAAAAgAAB9AAAAALU3RyZWFtRXJyb3IA",
        "AAAAAAAAAEVQYXllciBmcmVlemVzIGFjY3J1YWwuIFRoZSBzdHJlYW0gY2xvY2sgc3RvcHMgYXQgdGhlIHBhdXNlIHRpbWVzdGFtcC4AAAAAAAAFcGF1c2UAAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACXN0cmVhbV9pZAAAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAAC1N0cmVhbUVycm9yAA==",
        "AAAAAAAAAHpFaXRoZXIgcGFydHkgZW5kcyB0aGUgc3RyZWFtOiBhY2NydWVkIHN0cm9vcHMgZ28gdG8gdGhlIHJlY2lwaWVudCwKdGhlIHVudG91Y2hlZCByZW1haW5kZXIgcmV0dXJucyB0byB0aGUgcGF5ZXIuIFRlcm1pbmFsLgAAAAAABmNhbmNlbAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAlzdHJlYW1faWQAAAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAAtTdHJlYW1FcnJvcgA=",
        "AAAAAAAAADtQYXllciByZXN0YXJ0cyBhY2NydWFsLCBhY2NvdW50aW5nIGZvciBldmVyeSBwYXVzZWQgc2Vjb25kLgAAAAAGcmVzdW1lAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACXN0cmVhbV9pZAAAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAAC1N0cmVhbUVycm9yAA==",
        "AAAAAAAAADxDdXJyZW50bHkgY2xhaW1hYmxlIHN0cm9vcHMsIGNvbXB1dGVkIGZyb20gbGVkZ2VyIHRpbWUgb25seS4AAAAJY2xhaW1hYmxlAAAAAAAAAQAAAAAAAAAJc3RyZWFtX2lkAAAAAAAABgAAAAEAAAPpAAAACwAAB9AAAAALU3RyZWFtRXJyb3IA",
        "AAAAAAAAAAAAAAAKZ2V0X3N0cmVhbQAAAAAAAQAAAAAAAAAJc3RyZWFtX2lkAAAAAAAABgAAAAEAAAPpAAAH0AAAAAZTdHJlYW0AAAAAB9AAAAALU3RyZWFtRXJyb3IA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAA=",
        "AAAAAAAAAG5EZXBvc2l0IHJlYWwgWExNLiBgZGVwb3NpdCA9PSByYXRlICogZHVyYXRpb25gIGlzIHJlcXVpcmVkIHNvIHRoZQpzdHJlYW0gY2FuIG5ldmVyIHN0cmFuZCBvciBvdmVyZHJhdyBzdHJvb3BzLgAAAAAADWNyZWF0ZV9zdHJlYW0AAAAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAAB2RlcG9zaXQAAAAACwAAAAAAAAAEcmF0ZQAAAAsAAAAAAAAACGR1cmF0aW9uAAAABgAAAAEAAAPpAAAABgAAB9AAAAALU3RyZWFtRXJyb3IA" ]),
      options
    )
  }
  public readonly fromJSON = {
    claim: this.txFromJSON<Result<i128>>,
        close: this.txFromJSON<Result<void>>,
        pause: this.txFromJSON<Result<void>>,
        cancel: this.txFromJSON<Result<void>>,
        resume: this.txFromJSON<Result<void>>,
        claimable: this.txFromJSON<Result<i128>>,
        get_stream: this.txFromJSON<Result<Stream>>,
        create_stream: this.txFromJSON<Result<u64>>
  }
}