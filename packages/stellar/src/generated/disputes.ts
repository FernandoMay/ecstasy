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





export interface Dispute {
  counterparty: string;
  counterparty_responded: boolean;
  counterparty_response: Option<Buffer>;
  encounter_id: u64;
  id: u64;
  opened_at: u64;
  opener: string;
  opener_responded: boolean;
  opener_response: Option<Buffer>;
  outcome_hash: Option<Buffer>;
  reason_hash: Buffer;
  status: DisputeStatus;
}

export const DisputeError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"AlreadyResponded"}
}


export type DisputeStatus = {tag: "Open", values: void} | {tag: "Resolved", values: void};

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({dispute_id}: {dispute_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Dispute>>>

  /**
   * Construct and simulate a open transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Open a dispute for an encounter id. Any authenticated party may open
   * one; the counterparty and the reason digest are recorded on-chain.
   */
  open: ({caller, encounter_id, counterparty, reason_hash}: {caller: string, encounter_id: u64, counterparty: string, reason_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolver publishes the outcome digest. Terminal transition.
   */
  resolve: ({caller, dispute_id, outcome_hash}: {caller: string, dispute_id: u64, outcome_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a respond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record one party's response digest. Both parties may respond once.
   */
  respond: ({caller, dispute_id, response_hash}: {caller: string, dispute_id: u64, response_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {resolver}: {resolver: string},
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
    return ContractClient.deploy({resolver}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAB0Rpc3B1dGUAAAAADAAAAAAAAAAMY291bnRlcnBhcnR5AAAAEwAAAAAAAAAWY291bnRlcnBhcnR5X3Jlc3BvbmRlZAAAAAAAAQAAAAAAAAAVY291bnRlcnBhcnR5X3Jlc3BvbnNlAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAxlbmNvdW50ZXJfaWQAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAJb3BlbmVkX2F0AAAAAAAABgAAAAAAAAAGb3BlbmVyAAAAAAATAAAAAAAAABBvcGVuZXJfcmVzcG9uZGVkAAAAAQAAAAAAAAAPb3BlbmVyX3Jlc3BvbnNlAAAAA+gAAAPuAAAAIAAAAAAAAAAMb3V0Y29tZV9oYXNoAAAD6AAAA+4AAAAgAAAAAAAAAAtyZWFzb25faGFzaAAAAAPuAAAAIAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADURpc3B1dGVTdGF0dXMAAAA=",
        "AAAABAAAAAAAAAAAAAAADERpc3B1dGVFcnJvcgAAAAQAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAAEEFscmVhZHlSZXNwb25kZWQAAAAE",
        "AAAABQAAAAAAAAAAAAAADERpc3B1dGVFdmVudAAAAAEAAAANZGlzcHV0ZV9ldmVudAAAAAAAAAMAAAAAAAAABGtpbmQAAAARAAAAAQAAAAAAAAACaWQAAAAAAAYAAAAAAAAAAAAAAAVhY3RvcgAAAAAAABMAAAAAAAAAAg==",
        "AAAAAgAAAAAAAAAAAAAADURpc3B1dGVTdGF0dXMAAAAAAAACAAAAAAAAAAAAAAAET3BlbgAAAAAAAAAAAAAACFJlc29sdmVk",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAACmRpc3B1dGVfaWQAAAAAAAYAAAABAAAD6QAAB9AAAAAHRGlzcHV0ZQAAAAfQAAAADERpc3B1dGVFcnJvcg==",
        "AAAAAAAAAIdPcGVuIGEgZGlzcHV0ZSBmb3IgYW4gZW5jb3VudGVyIGlkLiBBbnkgYXV0aGVudGljYXRlZCBwYXJ0eSBtYXkgb3BlbgpvbmU7IHRoZSBjb3VudGVycGFydHkgYW5kIHRoZSByZWFzb24gZGlnZXN0IGFyZSByZWNvcmRlZCBvbi1jaGFpbi4AAAAABG9wZW4AAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGVuY291bnRlcl9pZAAAAAYAAAAAAAAADGNvdW50ZXJwYXJ0eQAAABMAAAAAAAAAC3JlYXNvbl9oYXNoAAAAA+4AAAAgAAAAAQAAA+kAAAAGAAAH0AAAAAxEaXNwdXRlRXJyb3I=",
        "AAAAAAAAADtSZXNvbHZlciBwdWJsaXNoZXMgdGhlIG91dGNvbWUgZGlnZXN0LiBUZXJtaW5hbCB0cmFuc2l0aW9uLgAAAAAHcmVzb2x2ZQAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACmRpc3B1dGVfaWQAAAAAAAYAAAAAAAAADG91dGNvbWVfaGFzaAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAAxEaXNwdXRlRXJyb3I=",
        "AAAAAAAAAEJSZWNvcmQgb25lIHBhcnR5J3MgcmVzcG9uc2UgZGlnZXN0LiBCb3RoIHBhcnRpZXMgbWF5IHJlc3BvbmQgb25jZS4AAAAAAAdyZXNwb25kAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAKZGlzcHV0ZV9pZAAAAAAABgAAAAAAAAANcmVzcG9uc2VfaGFzaAAAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAAxEaXNwdXRlRXJyb3I=",
        "AAAAAAAAACxQaW5zIHRoZSByZXNvbHZlciB0aGF0IG1heSBwdWJsaXNoIG91dGNvbWVzLgAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAQAAAAAAAAAIcmVzb2x2ZXIAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Dispute>>,
        open: this.txFromJSON<Result<u64>>,
        resolve: this.txFromJSON<Result<void>>,
        respond: this.txFromJSON<Result<void>>
  }
}