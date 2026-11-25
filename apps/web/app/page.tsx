"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateEncounterForm } from "@/components/CreateEncounterForm";
import { ExplorerEvidence } from "@/components/ExplorerEvidence";
import { useWallet } from "@/components/WalletProvider";

export default function Home() {
  const { config } = useWallet();
  const [enteredId, setEnteredId] = useState("");
  const configured = /^C[A-Z2-7]{55}$/.test(config.contractId);

  return (
    <>
      <section className="hero">
        <h1>
          Private encounters.
          <span>Public proof.</span>
        </h1>
        <p>
          ECSTASY is a consent-first private-agreement protocol on Stellar. Private terms stay
          off-chain; only the commitment and the agreed state transition are public.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#create">Create encounter</a>
          <a className="btn" href="#enter">Enter invitation</a>
        </div>
      </section>

      {!configured && (
        <div className="notice">
          <strong>Demo not configured.</strong> Set <code>NEXT_PUBLIC_CONTRACT_ID</code> (and
          optionally <code>NEXT_PUBLIC_ASSET_CONTRACT_ID</code>) in <code>.env.local</code> to
          enable real Testnet transactions. No mock chain data is used in this build.
        </div>
      )}

      <div id="enter" className="card" style={{ marginBottom: 24 }}>
        <h2>Enter invitation</h2>
        <p className="muted small">An invitation link contains only an encounter id — never private terms.</p>
        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 220 }}
            placeholder="Encounter id"
            value={enteredId}
            onChange={(event) => setEnteredId(event.target.value)}
          />
          <Link
            className="btn"
            aria-disabled={!enteredId}
            href={enteredId ? `/encounter/${enteredId}` : "#enter"}
          >
            Open →
          </Link>
        </div>
      </div>

      <div id="create" className="grid" style={{ alignItems: "start" }}>
        <CreateEncounterForm />
        <div>
          <div className="card">
            <h2>How it works</h2>
            <ol className="muted small" style={{ lineHeight: 1.9 }}>
              <li>Create an invitation with a canonical terms document and SHA-256 commitment.</li>
              <li>Share the private terms out-of-band; share only the id in the invitation link.</li>
              <li>The participant verifies the hash and consents on-chain.</li>
              <li>Both parties record completion; settlement releases optional escrow.</li>
              <li>Each participant may leave one bounded afterglow score.</li>
            </ol>
          </div>
          <div style={{ height: 18 }} />
          <ExplorerEvidence />
          <div style={{ height: 18 }} />
          <div className="card">
            <h3>What a proof means</h3>
            <p className="muted small">
              A transaction proves the contract accepted a state transition under its rules. It does
              not prove that any private, off-chain event was objectively true, safe, or legal. A
              hash is a commitment, not encryption.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
