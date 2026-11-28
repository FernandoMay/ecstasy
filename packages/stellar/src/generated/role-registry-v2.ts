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




export const RoleError = {
  1: {message:"NotAuthorized"},
  2: {message:"InvalidRole"},
  3: {message:"AlreadyGranted"},
  4: {message:"NotGranted"},
  5: {message:"LimitReached"}
}


export interface Client {
  /**
   * Construct and simulate a grant transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  grant: ({caller, role, account}: {caller: string, role: string, account: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  revoke: ({caller, role, account}: {caller: string, role: string, account: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a rotate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  rotate: ({caller, role, from, to}: {caller: string, role: string, from: string, to: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a has_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_role: ({role, account}: {role: string, account: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_holders transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Paginated read: bounded response regardless of holder count.
   */
  get_holders: ({role, offset, limit}: {role: string, offset: u32, limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
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
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAACVJvbGVFcnJvcgAAAAAAAAUAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAABAAAAAAAAAAtJbnZhbGlkUm9sZQAAAAACAAAAAAAAAA5BbHJlYWR5R3JhbnRlZAAAAAAAAwAAAAAAAAAKTm90R3JhbnRlZAAAAAAABAAAAAAAAAAMTGltaXRSZWFjaGVkAAAABQ==",
        "AAAABQAAAAAAAAAAAAAACVJvbGVFdmVudAAAAAAAAAEAAAAKcm9sZV9ldmVudAAAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAARyb2xlAAAAEQAAAAEAAAAAAAAAB2FjY291bnQAAAAAEwAAAAAAAAAC",
        "AAAAAAAAAAAAAAAFZ3JhbnQAAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABHJvbGUAAAARAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAD6QAAAAIAAAfQAAAACVJvbGVFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAGcmV2b2tlAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABHJvbGUAAAARAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAD6QAAAAIAAAfQAAAACVJvbGVFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAGcm90YXRlAAAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABHJvbGUAAAARAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAABAAAD6QAAAAIAAAfQAAAACVJvbGVFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAIaGFzX3JvbGUAAAACAAAAAAAAAARyb2xlAAAAEQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAE=",
        "AAAAAAAAADxQYWdpbmF0ZWQgcmVhZDogYm91bmRlZCByZXNwb25zZSByZWdhcmRsZXNzIG9mIGhvbGRlciBjb3VudC4AAAALZ2V0X2hvbGRlcnMAAAAAAwAAAAAAAAAEcm9sZQAAABEAAAAAAAAABm9mZnNldAAAAAAABAAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAA+oAAAAT",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    grant: this.txFromJSON<Result<void>>,
        revoke: this.txFromJSON<Result<void>>,
        rotate: this.txFromJSON<Result<void>>,
        has_role: this.txFromJSON<boolean>,
        get_holders: this.txFromJSON<Array<string>>
  }
}