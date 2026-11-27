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





export interface Profile {
  address: string;
  cases_recorded: u32;
  profile_hash: Buffer;
  registered_at: u64;
  suspended_until: u64;
  votes_recorded: u32;
}


export interface CaseRecord {
  case_id: u64;
  outcome_hash: Buffer;
  recorded_at: u64;
  source: string;
  subject: string;
}

export const ReputationError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"AlreadyRegistered"},
  4: {message:"DuplicateRecord"},
  5: {message:"InvalidDuration"},
  6: {message:"InvalidSubject"}
}


export interface Client {
  /**
   * Construct and simulate a suspend transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Temporary suspension with an explicit end timestamp.
   */
  suspend: ({caller, subject, reason_hash, until}: {caller: string, subject: string, reason_hash: Buffer, until: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_case transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_case: ({subject, case_id, source}: {subject: string, case_id: u64, source: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<CaseRecord>>>

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * A participant registers a public profile digest (never private terms).
   */
  register: ({caller, profile_hash}: {caller: string, profile_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_profile: ({subject}: {subject: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Profile>>>

  /**
   * Construct and simulate a record_case transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record a finalized case outcome digest from an authorized writer.
   */
  record_case: ({caller, subject, case_id, source, outcome_hash}: {caller: string, subject: string, case_id: u64, source: string, outcome_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a record_vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record panel participation as a digest; the secret vote is not revealed.
   */
  record_vote: ({caller, subject, case_id, source, participation_hash}: {caller: string, subject: string, case_id: u64, source: string, participation_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_eligibility transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Eligibility is factual: registered and not currently suspended.
   */
  get_eligibility: ({subject}: {subject: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a authorize_source transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The authority enables a source contract to write records.
   */
  authorize_source: ({caller, source}: {caller: string, source: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAB1Byb2ZpbGUAAAAABgAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAA5jYXNlc19yZWNvcmRlZAAAAAAABAAAAAAAAAAMcHJvZmlsZV9oYXNoAAAD7gAAACAAAAAAAAAADXJlZ2lzdGVyZWRfYXQAAAAAAAAGAAAAAAAAAA9zdXNwZW5kZWRfdW50aWwAAAAABgAAAAAAAAAOdm90ZXNfcmVjb3JkZWQAAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAACkNhc2VSZWNvcmQAAAAAAAUAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAMb3V0Y29tZV9oYXNoAAAD7gAAACAAAAAAAAAAC3JlY29yZGVkX2F0AAAAAAYAAAAAAAAABnNvdXJjZQAAAAAAEwAAAAAAAAAHc3ViamVjdAAAAAAT",
        "AAAABAAAAAAAAAAAAAAAD1JlcHV0YXRpb25FcnJvcgAAAAAGAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAACAAAAAAAAABFBbHJlYWR5UmVnaXN0ZXJlZAAAAAAAAAMAAAAAAAAAD0R1cGxpY2F0ZVJlY29yZAAAAAAEAAAAAAAAAA9JbnZhbGlkRHVyYXRpb24AAAAABQAAAAAAAAAOSW52YWxpZFN1YmplY3QAAAAAAAY=",
        "AAAABQAAAAAAAAAAAAAAD1JlcHV0YXRpb25FdmVudAAAAAABAAAAEHJlcHV0YXRpb25fZXZlbnQAAAACAAAAAAAAAARraW5kAAAAEQAAAAEAAAAAAAAAB3N1YmplY3QAAAAAEwAAAAAAAAAC",
        "AAAAAAAAADRUZW1wb3Jhcnkgc3VzcGVuc2lvbiB3aXRoIGFuIGV4cGxpY2l0IGVuZCB0aW1lc3RhbXAuAAAAB3N1c3BlbmQAAAAABAAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAdzdWJqZWN0AAAAABMAAAAAAAAAC3JlYXNvbl9oYXNoAAAAA+4AAAAgAAAAAAAAAAV1bnRpbAAAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAAD1JlcHV0YXRpb25FcnJvcgA=",
        "AAAAAAAAAAAAAAAIZ2V0X2Nhc2UAAAADAAAAAAAAAAdzdWJqZWN0AAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAGc291cmNlAAAAAAATAAAAAQAAA+kAAAfQAAAACkNhc2VSZWNvcmQAAAAAB9AAAAAPUmVwdXRhdGlvbkVycm9yAA==",
        "AAAAAAAAAEZBIHBhcnRpY2lwYW50IHJlZ2lzdGVycyBhIHB1YmxpYyBwcm9maWxlIGRpZ2VzdCAobmV2ZXIgcHJpdmF0ZSB0ZXJtcykuAAAAAAAIcmVnaXN0ZXIAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADHByb2ZpbGVfaGFzaAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAA9SZXB1dGF0aW9uRXJyb3IA",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2ZpbGUAAAAAAQAAAAAAAAAHc3ViamVjdAAAAAATAAAAAQAAA+kAAAfQAAAAB1Byb2ZpbGUAAAAH0AAAAA9SZXB1dGF0aW9uRXJyb3IA",
        "AAAAAAAAAEFSZWNvcmQgYSBmaW5hbGl6ZWQgY2FzZSBvdXRjb21lIGRpZ2VzdCBmcm9tIGFuIGF1dGhvcml6ZWQgd3JpdGVyLgAAAAAAAAtyZWNvcmRfY2FzZQAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB3N1YmplY3QAAAAAEwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAAAAAAZzb3VyY2UAAAAAABMAAAAAAAAADG91dGNvbWVfaGFzaAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAA9SZXB1dGF0aW9uRXJyb3IA",
        "AAAAAAAAAEhSZWNvcmQgcGFuZWwgcGFydGljaXBhdGlvbiBhcyBhIGRpZ2VzdDsgdGhlIHNlY3JldCB2b3RlIGlzIG5vdCByZXZlYWxlZC4AAAALcmVjb3JkX3ZvdGUAAAAABQAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAdzdWJqZWN0AAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAGc291cmNlAAAAAAATAAAAAAAAABJwYXJ0aWNpcGF0aW9uX2hhc2gAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAA9SZXB1dGF0aW9uRXJyb3IA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAACWF1dGhvcml0eQAAAAAAABMAAAAA",
        "AAAAAAAAAD9FbGlnaWJpbGl0eSBpcyBmYWN0dWFsOiByZWdpc3RlcmVkIGFuZCBub3QgY3VycmVudGx5IHN1c3BlbmRlZC4AAAAAD2dldF9lbGlnaWJpbGl0eQAAAAABAAAAAAAAAAdzdWJqZWN0AAAAABMAAAABAAAAAQ==",
        "AAAAAAAAADlUaGUgYXV0aG9yaXR5IGVuYWJsZXMgYSBzb3VyY2UgY29udHJhY3QgdG8gd3JpdGUgcmVjb3Jkcy4AAAAAAAAQYXV0aG9yaXplX3NvdXJjZQAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAGc291cmNlAAAAAAATAAAAAQAAA+kAAAACAAAH0AAAAA9SZXB1dGF0aW9uRXJyb3IA" ]),
      options
    )
  }
  public readonly fromJSON = {
    suspend: this.txFromJSON<Result<void>>,
        get_case: this.txFromJSON<Result<CaseRecord>>,
        register: this.txFromJSON<Result<void>>,
        get_profile: this.txFromJSON<Result<Profile>>,
        record_case: this.txFromJSON<Result<void>>,
        record_vote: this.txFromJSON<Result<void>>,
        get_eligibility: this.txFromJSON<boolean>,
        authorize_source: this.txFromJSON<Result<void>>
  }
}