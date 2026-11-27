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





export interface Arbitrator {
  address: string;
  controller_hash: Option<Buffer>;
  eligible: boolean;
  profile_hash: Buffer;
  registered_at: u64;
}

export const RegistryError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"AlreadyRegistered"},
  4: {message:"DuplicateController"},
  5: {message:"NotEligible"}
}


export interface Client {
  /**
   * Construct and simulate a attest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The registrar binds one controller to one address, and can revoke it.
   */
  attest: ({caller, arbitrator, controller_hash}: {caller: string, arbitrator: string, controller_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  revoke: ({caller, arbitrator}: {caller: string, arbitrator: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Self-registration. Eligibility requires a registrar attestation.
   */
  register: ({caller, profile_hash}: {caller: string, profile_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_profile: ({arbitrator}: {arbitrator: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Arbitrator>>>

  /**
   * Construct and simulate a is_eligible transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_eligible: ({arbitrator}: {arbitrator: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_eligible transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Eligible arbitrators in registration order: the snapshot used by Panel V2.
   */
  get_eligible: (options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {registrar}: {registrar: string},
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
    return ContractClient.deploy({registrar}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACkFyYml0cmF0b3IAAAAAAAUAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAPY29udHJvbGxlcl9oYXNoAAAAA+gAAAPuAAAAIAAAAAAAAAAIZWxpZ2libGUAAAABAAAAAAAAAAxwcm9maWxlX2hhc2gAAAPuAAAAIAAAAAAAAAANcmVnaXN0ZXJlZF9hdAAAAAAAAAY=",
        "AAAABAAAAAAAAAAAAAAADVJlZ2lzdHJ5RXJyb3IAAAAAAAAFAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAACAAAAAAAAABFBbHJlYWR5UmVnaXN0ZXJlZAAAAAAAAAMAAAAAAAAAE0R1cGxpY2F0ZUNvbnRyb2xsZXIAAAAABAAAAAAAAAALTm90RWxpZ2libGUAAAAABQ==",
        "AAAABQAAAAAAAAAAAAAADVJlZ2lzdHJ5RXZlbnQAAAAAAAABAAAADnJlZ2lzdHJ5X2V2ZW50AAAAAAACAAAAAAAAAARraW5kAAAAEQAAAAEAAAAAAAAAB3N1YmplY3QAAAAAEwAAAAEAAAAC",
        "AAAAAAAAAEVUaGUgcmVnaXN0cmFyIGJpbmRzIG9uZSBjb250cm9sbGVyIHRvIG9uZSBhZGRyZXNzLCBhbmQgY2FuIHJldm9rZSBpdC4AAAAAAAAGYXR0ZXN0AAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACmFyYml0cmF0b3IAAAAAABMAAAAAAAAAD2NvbnRyb2xsZXJfaGFzaAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANUmVnaXN0cnlFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAGcmV2b2tlAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACmFyYml0cmF0b3IAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAADVJlZ2lzdHJ5RXJyb3IAAAA=",
        "AAAAAAAAAEBTZWxmLXJlZ2lzdHJhdGlvbi4gRWxpZ2liaWxpdHkgcmVxdWlyZXMgYSByZWdpc3RyYXIgYXR0ZXN0YXRpb24uAAAACHJlZ2lzdGVyAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxwcm9maWxlX2hhc2gAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANUmVnaXN0cnlFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2ZpbGUAAAAAAQAAAAAAAAAKYXJiaXRyYXRvcgAAAAAAEwAAAAEAAAPpAAAH0AAAAApBcmJpdHJhdG9yAAAAAAfQAAAADVJlZ2lzdHJ5RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAALaXNfZWxpZ2libGUAAAAAAQAAAAAAAAAKYXJiaXRyYXRvcgAAAAAAEwAAAAEAAAAB",
        "AAAAAAAAAEpFbGlnaWJsZSBhcmJpdHJhdG9ycyBpbiByZWdpc3RyYXRpb24gb3JkZXI6IHRoZSBzbmFwc2hvdCB1c2VkIGJ5IFBhbmVsIFYyLgAAAAAADGdldF9lbGlnaWJsZQAAAAAAAAABAAAD6gAAABM=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAACXJlZ2lzdHJhcgAAAAAAABMAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    attest: this.txFromJSON<Result<void>>,
        revoke: this.txFromJSON<Result<void>>,
        register: this.txFromJSON<Result<void>>,
        get_profile: this.txFromJSON<Result<Arbitrator>>,
        is_eligible: this.txFromJSON<boolean>,
        get_eligible: this.txFromJSON<Array<string>>
  }
}