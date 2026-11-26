"use client";

import { canonicalizeTerms, termsDigest, toHex, type Encounter, type TermsDocument } from "@ecstasy/stellar";
import { useState } from "react";
import { TermsHashBadge } from "./TermsHashBadge";
import { decryptTerms, parseEnvelopeText } from "@/lib/terms-envelope";

export function ConsentSheet({
  encounter,
  disabled,
  onAccept,
  onDecline,
}: {
  encounter: Encounter;
  disabled?: boolean;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [pasted, setPasted] = useState("");
  const [match, setMatch] = useState<boolean | null>(null);
  const [canonicalValid, setCanonicalValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [encrypted, setEncrypted] = useState("");
  const [envelopePassphrase, setEnvelopePassphrase] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const onChainHash = toHex(new Uint8Array(encounter.terms_hash));

  async function verify() {
    try {
      const doc = JSON.parse(pasted) as TermsDocument;
      const canonical = canonicalizeTerms(doc);
      setCanonicalValid(canonical.length > 0 && canonical.startsWith("{"));
      const digest = toHex(await termsDigest(doc));
      setMatch(digest === onChainHash);
    } catch {
      setMatch(false);
    }
  }

  async function act(action: "accept" | "decline") {
    setBusy(true);
    try {
      await (action === "accept" ? onAccept() : onDecline());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>Consent sheet</h3>
      <p className="muted small">
        Private terms are never stored on-chain. Paste the terms document you received out-of-band
        to verify it matches the on-chain commitment before consenting.
      </p>
      <div className="row" style={{ marginBottom: 12 }}>
        <TermsHashBadge hash={encounter.terms_hash} />
      </div>
      <textarea
        className="textarea"
        placeholder='Paste the private terms JSON here'
        value={pasted}
        onChange={(event) => {
          setPasted(event.target.value);
          setMatch(null);
          setCanonicalValid(false);
        }}
        aria-label="Private terms document"
      />
      <div className="field" style={{ marginTop: 16 }}>
        <label className="label" htmlFor="encrypted-terms">Términos cifrados (opcional)</label>
        <textarea
          id="encrypted-terms"
          className="textarea"
          value={encrypted}
          onChange={(event) => setEncrypted(event.target.value)}
          placeholder="ECSTASY-TERMS-1:..."
        />
        <input
          className="input"
          type="password"
          aria-label="Frase secreta para descifrar"
          value={envelopePassphrase}
          onChange={(event) => setEnvelopePassphrase(event.target.value)}
          placeholder="Frase secreta"
        />
        <button
          className="btn btn-small"
          disabled={!encrypted.trim() || !envelopePassphrase}
          onClick={async () => {
            setImportError(null);
            try {
              const document = await decryptTerms(parseEnvelopeText(encrypted), envelopePassphrase);
              setPasted(JSON.stringify(document, null, 2));
              setMatch(null);
              setCanonicalValid(true);
            } catch (cause) {
              setImportError(cause instanceof Error ? cause.message : String(cause));
            }
          }}
        >
          Descifrar y cargar términos
        </button>
        {importError && <div className="notice error">{importError}</div>}
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-small" onClick={verify} disabled={!pasted.trim()}>
          Verify terms hash
        </button>
        {canonicalValid && <span className="small success-text">✓ Canonicalization valid</span>}
        {match === true && <span className="small success-text">✓ Hash matches on-chain</span>}
        {match === false && <span className="small" style={{ color: "var(--danger)" }}>✕ Terms do not match — do not consent</span>}
      </div>
      <div className="row" style={{ marginTop: 18 }}>
        <button
          className="btn btn-primary"
          disabled={disabled || busy || match !== true}
          onClick={() => act("accept")}
        >
          Consent / Accept
        </button>
        <button className="btn btn-danger" disabled={disabled || busy} onClick={() => act("decline")}>
          Decline
        </button>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Acceptance is gated on a verified hash so a substituted terms document cannot be consented
        to from this screen.
      </p>
    </div>
  );
}
