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





export interface Proposal {
  amount: i128;
  counterparty: string;
  created_at: u64;
  expires_at: u64;
  id: u64;
  intent_hash: Buffer;
  proposer: string;
  recipient: string;
  status: ProposalStatus;
}

export const RecoveryError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"IntentMismatch"},
  5: {message:"InvalidAmount"},
  6: {message:"InvalidExpiry"},
  7: {message:"StillPending"},
  8: {message:"InsufficientFunds"}
}


export type ProposalStatus = {tag: "Pending", values: void} | {tag: "Approved", values: void} | {tag: "Executed", values: void} | {tag: "Recovered", values: void};

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({proposal_id}: {proposal_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Proposal>>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Approve the same intent before the deadline.
   */
  approve: ({caller, proposal_id, intent_hash}: {caller: string, proposal_id: u64, intent_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a execute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute an approved transfer, only before expiry.
   */
  execute: ({caller, proposal_id}: {caller: string, proposal_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a propose transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit real SAC funds and fix the deadline for mutual approval.
   */
  propose: ({caller, counterparty, recipient, amount, intent_hash, expires_at}: {caller: string, counterparty: string, recipient: string, amount: i128, intent_hash: Buffer, expires_at: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a recover transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless recovery after expiry. Funds always return to the
   * proposer, never to the caller. Terminal and single-shot.
   */
  recover: ({caller, proposal_id}: {caller: string, proposal_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACFByb3Bvc2FsAAAACQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAxjb3VudGVycGFydHkAAAATAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAALaW50ZW50X2hhc2gAAAAD7gAAACAAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAAJcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADlByb3Bvc2FsU3RhdHVzAAA=",
        "AAAABAAAAAAAAAAAAAAADVJlY292ZXJ5RXJyb3IAAAAAAAAIAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAACAAAAAAAAAAxJbnZhbGlkU3RhdGUAAAADAAAAAAAAAA5JbnRlbnRNaXNtYXRjaAAAAAAABAAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAUAAAAAAAAADUludmFsaWRFeHBpcnkAAAAAAAAGAAAAAAAAAAxTdGlsbFBlbmRpbmcAAAAHAAAAAAAAABFJbnN1ZmZpY2llbnRGdW5kcwAAAAAAAAg=",
        "AAAABQAAAAAAAAAAAAAADVJlY292ZXJ5RXZlbnQAAAAAAAABAAAADnJlY292ZXJ5X2V2ZW50AAAAAAADAAAAAAAAAARraW5kAAAAEQAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAAAAAAFYWN0b3IAAAAAAAATAAAAAAAAAAI=",
        "AAAAAgAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAEAAAAAAAAAAAAAAAHUGVuZGluZwAAAAAAAAAAAAAAAAhBcHByb3ZlZAAAAAAAAAAAAAAACEV4ZWN1dGVkAAAAAAAAAAAAAAAJUmVjb3ZlcmVkAAAA",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAYAAAABAAAD6QAAB9AAAAAIUHJvcG9zYWwAAAfQAAAADVJlY292ZXJ5RXJyb3IAAAA=",
        "AAAAAAAAACxBcHByb3ZlIHRoZSBzYW1lIGludGVudCBiZWZvcmUgdGhlIGRlYWRsaW5lLgAAAAdhcHByb3ZlAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAAAAAALaW50ZW50X2hhc2gAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAADVJlY292ZXJ5RXJyb3IAAAA=",
        "AAAAAAAAADFFeGVjdXRlIGFuIGFwcHJvdmVkIHRyYW5zZmVyLCBvbmx5IGJlZm9yZSBleHBpcnkuAAAAAAAAB2V4ZWN1dGUAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAA1SZWNvdmVyeUVycm9yAAAA",
        "AAAAAAAAAEBEZXBvc2l0IHJlYWwgU0FDIGZ1bmRzIGFuZCBmaXggdGhlIGRlYWRsaW5lIGZvciBtdXR1YWwgYXBwcm92YWwuAAAAB3Byb3Bvc2UAAAAABgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxjb3VudGVycGFydHkAAAATAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAC2ludGVudF9oYXNoAAAAA+4AAAAgAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAQAAA+kAAAAGAAAH0AAAAA1SZWNvdmVyeUVycm9yAAAA",
        "AAAAAAAAAHlQZXJtaXNzaW9ubGVzcyByZWNvdmVyeSBhZnRlciBleHBpcnkuIEZ1bmRzIGFsd2F5cyByZXR1cm4gdG8gdGhlCnByb3Bvc2VyLCBuZXZlciB0byB0aGUgY2FsbGVyLiBUZXJtaW5hbCBhbmQgc2luZ2xlLXNob3QuAAAAAAAAB3JlY292ZXIAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAA1SZWNvdmVyeUVycm9yAAAA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Proposal>>,
        approve: this.txFromJSON<Result<void>>,
        execute: this.txFromJSON<Result<void>>,
        propose: this.txFromJSON<Result<u64>>,
        recover: this.txFromJSON<Result<void>>
  }
}