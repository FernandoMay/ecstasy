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





export interface Vault {
  attributed: i128;
  created_at: u64;
  id: u64;
  label_hash: Buffer;
  owner: string;
  status: VaultStatus;
}


export type VaultStatus = {tag: "Active", values: void} | {tag: "Closed", values: void};

export const VaultV2Error = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"InsufficientAttributed"},
  6: {message:"NoSurplus"},
  7: {message:"InsufficientFunds"}
}

export interface Client {
  /**
   * Construct and simulate a fund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The only legitimate funding path: XLM and attribution move together.
   */
  fund: ({caller, vault_id, amount}: {caller: string, vault_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a close transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Close an empty vault. Attributed funds always keep a withdrawal path.
   */
  close: ({caller, vault_id}: {caller: string, vault_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw only from the caller's own attributed balance.
   */
  withdraw: ({caller, vault_id, amount}: {caller: string, vault_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_vault transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_vault: ({vault_id}: {vault_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Vault>>>

  /**
   * Construct and simulate a get_surplus transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_surplus: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a create_vault transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create an empty vault. No funds move and no attribution is created.
   */
  create_vault: ({caller, label_hash}: {caller: string, label_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a sweep_surplus transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless, deterministic: sweep only balance minus attribution.
   */
  sweep_surplus: ({caller}: {caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_total_attributed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_attributed: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset, surplus_destination}: {asset: string, surplus_destination: string},
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
    return ContractClient.deploy({asset, surplus_destination}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABVZhdWx0AAAAAAAABgAAAAAAAAAKYXR0cmlidXRlZAAAAAAACwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAACaWQAAAAAAAYAAAAAAAAACmxhYmVsX2hhc2gAAAAAA+4AAAAgAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAtWYXVsdFN0YXR1cwA=",
        "AAAABQAAAAAAAAAAAAAAClZhdWx0RXZlbnQAAAAAAAEAAAALdmF1bHRfZXZlbnQAAAAABAAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAh2YXVsdF9pZAAAAAYAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAAAAAAVhY3RvcgAAAAAAABMAAAAAAAAAAg==",
        "AAAAAgAAAAAAAAAAAAAAC1ZhdWx0U3RhdHVzAAAAAAIAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAABkNsb3NlZAAA",
        "AAAABAAAAAAAAAAAAAAADFZhdWx0VjJFcnJvcgAAAAcAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAEAAAAAAAAABZJbnN1ZmZpY2llbnRBdHRyaWJ1dGVkAAAAAAAFAAAAAAAAAAlOb1N1cnBsdXMAAAAAAAAGAAAAAAAAABFJbnN1ZmZpY2llbnRGdW5kcwAAAAAAAAc=",
        "AAAAAAAAAERUaGUgb25seSBsZWdpdGltYXRlIGZ1bmRpbmcgcGF0aDogWExNIGFuZCBhdHRyaWJ1dGlvbiBtb3ZlIHRvZ2V0aGVyLgAAAARmdW5kAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAh2YXVsdF9pZAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAB9AAAAAMVmF1bHRWMkVycm9y",
        "AAAAAAAAAEVDbG9zZSBhbiBlbXB0eSB2YXVsdC4gQXR0cmlidXRlZCBmdW5kcyBhbHdheXMga2VlcCBhIHdpdGhkcmF3YWwgcGF0aC4AAAAAAAAFY2xvc2UAAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHZhdWx0X2lkAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMVmF1bHRWMkVycm9y",
        "AAAAAAAAADdXaXRoZHJhdyBvbmx5IGZyb20gdGhlIGNhbGxlcidzIG93biBhdHRyaWJ1dGVkIGJhbGFuY2UuAAAAAAh3aXRoZHJhdwAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIdmF1bHRfaWQAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAsAAAfQAAAADFZhdWx0VjJFcnJvcg==",
        "AAAAAAAAAAAAAAAJZ2V0X3ZhdWx0AAAAAAAAAQAAAAAAAAAIdmF1bHRfaWQAAAAGAAAAAQAAA+kAAAfQAAAABVZhdWx0AAAAAAAH0AAAAAxWYXVsdFYyRXJyb3I=",
        "AAAAAAAAAAAAAAALZ2V0X3N1cnBsdXMAAAAAAAAAAAEAAAAL",
        "AAAAAAAAAENDcmVhdGUgYW4gZW1wdHkgdmF1bHQuIE5vIGZ1bmRzIG1vdmUgYW5kIG5vIGF0dHJpYnV0aW9uIGlzIGNyZWF0ZWQuAAAAAAxjcmVhdGVfdmF1bHQAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACmxhYmVsX2hhc2gAAAAAA+4AAAAgAAAAAQAAA+kAAAAGAAAH0AAAAAxWYXVsdFYyRXJyb3I=",
        "AAAAAAAAAEJUaGUgc3VycGx1cyBkZXN0aW5hdGlvbiBpcyBpbW11dGFibGUgYW5kIGtub3duIGJlZm9yZSBhbnkgZGVwb3NpdC4AAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAgAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAABNzdXJwbHVzX2Rlc3RpbmF0aW9uAAAAABMAAAAA",
        "AAAAAAAAAERQZXJtaXNzaW9ubGVzcywgZGV0ZXJtaW5pc3RpYzogc3dlZXAgb25seSBiYWxhbmNlIG1pbnVzIGF0dHJpYnV0aW9uLgAAAA1zd2VlcF9zdXJwbHVzAAAAAAAAAQAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAQAAA+kAAAALAAAH0AAAAAxWYXVsdFYyRXJyb3I=",
        "AAAAAAAAAAAAAAAUZ2V0X3RvdGFsX2F0dHJpYnV0ZWQAAAAAAAAAAQAAAAs=" ]),
      options
    )
  }
  public readonly fromJSON = {
    fund: this.txFromJSON<Result<void>>,
        close: this.txFromJSON<Result<void>>,
        withdraw: this.txFromJSON<Result<i128>>,
        get_vault: this.txFromJSON<Result<Vault>>,
        get_surplus: this.txFromJSON<i128>,
        create_vault: this.txFromJSON<Result<u64>>,
        sweep_surplus: this.txFromJSON<Result<i128>>,
        get_total_attributed: this.txFromJSON<i128>
  }
}