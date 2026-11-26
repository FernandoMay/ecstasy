// GENERATED FILE — do not edit by hand.
// Bóveda wasm hash: 7d19a5e979def3bb33cbfdabb91dea167e837abe8e9186d0542d97d3a5a30d5a
// Regenerate with stellar contract bindings typescript.
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





export const BovedaError = {
  1: {message:"InvalidCode"},
  2: {message:"AlreadyClaimed"},
  3: {message:"Empty"},
  4: {message:"InvalidAmount"}
}

export interface Client {
  /**
   * Construct and simulate a fund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lock funds in the vault. Anyone can fund it; only `reclamar` can move
   * them out.
   */
  fund: ({caller, amount}: {caller: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Public read: whether the vault was claimed and its current balance.
   */
  status: (options?: MethodOptions) => Promise<AssembledTransaction<readonly [boolean, i128]>>

  /**
   * Construct and simulate a reclamar transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * NEW PUBLIC FUNCTION — claim the whole vault with the correct code.
   * The caller supplies a 32-byte SHA-256 digest of the code; the contract
   * compares it with the digest pinned at deployment and never sees the
   * code itself. Terminal: one claim per vault.
   */
  reclamar: ({caller, code_hash}: {caller: string, code_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset, code_hash}: {asset: string, code_hash: Buffer},
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
    return ContractClient.deploy({asset, code_hash}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAACkNsYWltRXZlbnQAAAAAAAEAAAALY2xhaW1fZXZlbnQAAAAAAgAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==",
        "AAAABAAAAAAAAAAAAAAAC0JvdmVkYUVycm9yAAAAAAQAAAAAAAAAC0ludmFsaWRDb2RlAAAAAAEAAAAAAAAADkFscmVhZHlDbGFpbWVkAAAAAAACAAAAAAAAAAVFbXB0eQAAAAAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAE",
        "AAAAAAAAAE9Mb2NrIGZ1bmRzIGluIHRoZSB2YXVsdC4gQW55b25lIGNhbiBmdW5kIGl0OyBvbmx5IGByZWNsYW1hcmAgY2FuIG1vdmUKdGhlbSBvdXQuAAAAAARmdW5kAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAfQAAAAC0JvdmVkYUVycm9yAA==",
        "AAAAAAAAAENQdWJsaWMgcmVhZDogd2hldGhlciB0aGUgdmF1bHQgd2FzIGNsYWltZWQgYW5kIGl0cyBjdXJyZW50IGJhbGFuY2UuAAAAAAZzdGF0dXMAAAAAAAAAAAABAAAD7QAAAAIAAAABAAAACw==",
        "AAAAAAAAAPtORVcgUFVCTElDIEZVTkNUSU9OIOKAlCBjbGFpbSB0aGUgd2hvbGUgdmF1bHQgd2l0aCB0aGUgY29ycmVjdCBjb2RlLgpUaGUgY2FsbGVyIHN1cHBsaWVzIGEgMzItYnl0ZSBTSEEtMjU2IGRpZ2VzdCBvZiB0aGUgY29kZTsgdGhlIGNvbnRyYWN0CmNvbXBhcmVzIGl0IHdpdGggdGhlIGRpZ2VzdCBwaW5uZWQgYXQgZGVwbG95bWVudCBhbmQgbmV2ZXIgc2VlcyB0aGUKY29kZSBpdHNlbGYuIFRlcm1pbmFsOiBvbmUgY2xhaW0gcGVyIHZhdWx0LgAAAAAIcmVjbGFtYXIAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACWNvZGVfaGFzaAAAAAAAA+4AAAAgAAAAAQAAA+kAAAALAAAH0AAAAAtCb3ZlZGFFcnJvcgA=",
        "AAAAAAAAAENQaW5zIHRoZSBlc2Nyb3cgYXNzZXQgYW5kIHRoZSBTSEEtMjU2IGNvbW1pdG1lbnQgb2YgdGhlIGNsYWltIGNvZGUuAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAgAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAljb2RlX2hhc2gAAAAAAAPuAAAAIAAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    fund: this.txFromJSON<Result<void>>,
        status: this.txFromJSON<readonly [boolean, i128]>,
        reclamar: this.txFromJSON<Result<i128>>
  }
}