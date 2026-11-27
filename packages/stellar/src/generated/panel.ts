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





export interface PanelCase {
  agreement_id: u64;
  amount: i128;
  arbitrators: Array<string>;
  commit_deadline: u64;
  evidence_hash: Buffer;
  id: u64;
  outcome_code: Option<u32>;
  proposer: string;
  recipient: string;
  reveal_deadline: u64;
  status: PanelStatus;
}

export const PanelError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidDecision"},
  5: {message:"CommitmentMismatch"},
  6: {message:"AlreadyCommitted"},
  7: {message:"AlreadyRevealed"},
  8: {message:"TooEarly"},
  9: {message:"InvalidPanel"},
  10: {message:"InsufficientFunds"}
}


export type PanelStatus = {tag: "Open", values: void} | {tag: "Resolved", values: void} | {tag: "NoQuorum", values: void};

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<PanelCase>>>

  /**
   * Construct and simulate a commit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Arbitrator commits a digest binding case, arbitrator, decision, secret.
   */
  commit: ({caller, case_id, commitment}: {caller: string, case_id: u64, commitment: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Open a case funded with real XLM and designate exactly three arbitrators.
   */
  create: ({caller, agreement_id, recipient, amount, evidence_hash, arbitrators, commit_deadline, reveal_deadline}: {caller: string, agreement_id: u64, recipient: string, amount: i128, evidence_hash: Buffer, arbitrators: Array<string>, commit_deadline: u64, reveal_deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a reveal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reveal the committed decision. Decision codes: 1 Release, 2 Refund, 3 Split.
   */
  reveal: ({caller, case_id, decision, secret}: {caller: string, case_id: u64, decision: u32, secret: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless settlement after the reveal window. 2-of-3 quorum.
   */
  resolve: ({caller, case_id}: {caller: string, case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a commitment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Same byte layout as the web client helper `panelCommitment`.
   */
  commitment: ({case_id, arbitrator, decision, secret}: {case_id: u64, arbitrator: string, decision: u32, secret: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACVBhbmVsQ2FzZQAAAAAAAAsAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAALYXJiaXRyYXRvcnMAAAAD6gAAABMAAAAAAAAAD2NvbW1pdF9kZWFkbGluZQAAAAAGAAAAAAAAAA1ldmlkZW5jZV9oYXNoAAAAAAAD7gAAACAAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAxvdXRjb21lX2NvZGUAAAPoAAAABAAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAA9yZXZlYWxfZGVhZGxpbmUAAAAABgAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAC1BhbmVsU3RhdHVzAA==",
        "AAAABAAAAAAAAAAAAAAAClBhbmVsRXJyb3IAAAAAAAoAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAAD0ludmFsaWREZWNpc2lvbgAAAAAEAAAAAAAAABJDb21taXRtZW50TWlzbWF0Y2gAAAAAAAUAAAAAAAAAEEFscmVhZHlDb21taXR0ZWQAAAAGAAAAAAAAAA9BbHJlYWR5UmV2ZWFsZWQAAAAABwAAAAAAAAAIVG9vRWFybHkAAAAIAAAAAAAAAAxJbnZhbGlkUGFuZWwAAAAJAAAAAAAAABFJbnN1ZmZpY2llbnRGdW5kcwAAAAAAAAo=",
        "AAAABQAAAAAAAAAAAAAAClBhbmVsRXZlbnQAAAAAAAEAAAALcGFuZWxfZXZlbnQAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAAAAAABWFjdG9yAAAAAAAAEwAAAAAAAAAC",
        "AAAAAgAAAAAAAAAAAAAAC1BhbmVsU3RhdHVzAAAAAAMAAAAAAAAAAAAAAARPcGVuAAAAAAAAAAAAAAAIUmVzb2x2ZWQAAAAAAAAAAAAAAAhOb1F1b3J1bQ==",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAH0AAAAAlQYW5lbENhc2UAAAAAAAfQAAAAClBhbmVsRXJyb3IAAA==",
        "AAAAAAAAAEdBcmJpdHJhdG9yIGNvbW1pdHMgYSBkaWdlc3QgYmluZGluZyBjYXNlLCBhcmJpdHJhdG9yLCBkZWNpc2lvbiwgc2VjcmV0LgAAAAAGY29tbWl0AAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAKY29tbWl0bWVudAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAAClBhbmVsRXJyb3IAAA==",
        "AAAAAAAAAElPcGVuIGEgY2FzZSBmdW5kZWQgd2l0aCByZWFsIFhMTSBhbmQgZGVzaWduYXRlIGV4YWN0bHkgdGhyZWUgYXJiaXRyYXRvcnMuAAAAAAAABmNyZWF0ZQAAAAAACAAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAAAAAALYXJiaXRyYXRvcnMAAAAD6gAAABMAAAAAAAAAD2NvbW1pdF9kZWFkbGluZQAAAAAGAAAAAAAAAA9yZXZlYWxfZGVhZGxpbmUAAAAABgAAAAEAAAPpAAAABgAAB9AAAAAKUGFuZWxFcnJvcgAA",
        "AAAAAAAAAExSZXZlYWwgdGhlIGNvbW1pdHRlZCBkZWNpc2lvbi4gRGVjaXNpb24gY29kZXM6IDEgUmVsZWFzZSwgMiBSZWZ1bmQsIDMgU3BsaXQuAAAABnJldmVhbAAAAAAABAAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAAAAAAACGRlY2lzaW9uAAAABAAAAAAAAAAGc2VjcmV0AAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAAKUGFuZWxFcnJvcgAA",
        "AAAAAAAAAEFQZXJtaXNzaW9ubGVzcyBzZXR0bGVtZW50IGFmdGVyIHRoZSByZXZlYWwgd2luZG93LiAyLW9mLTMgcXVvcnVtLgAAAAAAAAdyZXNvbHZlAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAApQYW5lbEVycm9yAAA=",
        "AAAAAAAAADxTYW1lIGJ5dGUgbGF5b3V0IGFzIHRoZSB3ZWIgY2xpZW50IGhlbHBlciBgcGFuZWxDb21taXRtZW50YC4AAAAKY29tbWl0bWVudAAAAAAABAAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAAAAAAphcmJpdHJhdG9yAAAAAAATAAAAAAAAAAhkZWNpc2lvbgAAAAQAAAAAAAAABnNlY3JldAAAAAAD7gAAACAAAAABAAAD7gAAACA=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<PanelCase>>,
        commit: this.txFromJSON<Result<void>>,
        create: this.txFromJSON<Result<u64>>,
        reveal: this.txFromJSON<Result<void>>,
        resolve: this.txFromJSON<Result<void>>,
        commitment: this.txFromJSON<Buffer>
  }
}