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




export const TraceError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"Duplicate"},
  4: {message:"InvalidReference"}
}



export interface ChainRecord {
  agreement_id: u64;
  arbitration_id: u64;
  case_id: u64;
  escrow_id: u64;
  recorded_at: u64;
  /**
 * 32-byte hash of the real settlement transaction on Testnet.
 */
settlement_tx: Buffer;
  writer: string;
}

export interface Client {
  /**
   * Construct and simulate a link transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Link the lifecycle of an agreement. Only authorized writers may write,
   * and an agreement_id may only be linked once.
   */
  link: ({caller, agreement_id, escrow_id, case_id, arbitration_id, settlement_tx}: {caller: string, agreement_id: u64, escrow_id: u64, case_id: u64, arbitration_id: u64, settlement_tx: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_chain transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_chain: ({agreement_id}: {agreement_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<ChainRecord>>>

  /**
   * Construct and simulate a authorize_writer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The authority enables a contract or account to write chain records.
   */
  authorize_writer: ({caller, writer}: {caller: string, writer: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {authority}: {authority: string},
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
    return ContractClient.deploy({authority}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAAClRyYWNlRXJyb3IAAAAAAAQAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAACUR1cGxpY2F0ZQAAAAAAAAMAAAAAAAAAEEludmFsaWRSZWZlcmVuY2UAAAAE",
        "AAAABQAAAAAAAAAAAAAAClRyYWNlRXZlbnQAAAAAAAEAAAALdHJhY2VfZXZlbnQAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAQAAAAAAAAAGd3JpdGVyAAAAAAATAAAAAAAAAAI=",
        "AAAAAQAAAAAAAAAAAAAAC0NoYWluUmVjb3JkAAAAAAcAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAADmFyYml0cmF0aW9uX2lkAAAAAAAGAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAAAAAAACWVzY3Jvd19pZAAAAAAAAAYAAAAAAAAAC3JlY29yZGVkX2F0AAAAAAYAAAA7MzItYnl0ZSBoYXNoIG9mIHRoZSByZWFsIHNldHRsZW1lbnQgdHJhbnNhY3Rpb24gb24gVGVzdG5ldC4AAAAADXNldHRsZW1lbnRfdHgAAAAAAAPuAAAAIAAAAAAAAAAGd3JpdGVyAAAAAAAT",
        "AAAAAAAAAHNMaW5rIHRoZSBsaWZlY3ljbGUgb2YgYW4gYWdyZWVtZW50LiBPbmx5IGF1dGhvcml6ZWQgd3JpdGVycyBtYXkgd3JpdGUsCmFuZCBhbiBhZ3JlZW1lbnRfaWQgbWF5IG9ubHkgYmUgbGlua2VkIG9uY2UuAAAAAARsaW5rAAAABgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAllc2Nyb3dfaWQAAAAAAAAGAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAAAAAAADmFyYml0cmF0aW9uX2lkAAAAAAAGAAAAAAAAAA1zZXR0bGVtZW50X3R4AAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAAClRyYWNlRXJyb3IAAA==",
        "AAAAAAAAAAAAAAAJZ2V0X2NoYWluAAAAAAAAAQAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAEAAAPpAAAH0AAAAAtDaGFpblJlY29yZAAAAAfQAAAAClRyYWNlRXJyb3IAAA==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAACWF1dGhvcml0eQAAAAAAABMAAAAA",
        "AAAAAAAAAENUaGUgYXV0aG9yaXR5IGVuYWJsZXMgYSBjb250cmFjdCBvciBhY2NvdW50IHRvIHdyaXRlIGNoYWluIHJlY29yZHMuAAAAABBhdXRob3JpemVfd3JpdGVyAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAZ3cml0ZXIAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAAClRyYWNlRXJyb3IAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    link: this.txFromJSON<Result<void>>,
        get_chain: this.txFromJSON<Result<ChainRecord>>,
        authorize_writer: this.txFromJSON<Result<void>>
  }
}