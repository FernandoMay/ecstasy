"use client";

import Link from "next/link";
import { formatDistanceToNowStrict } from "@/lib/format";
import {
  shortAddress,
  statusName,
  type AppConfig,
  type Encounter,
} from "@ecstasy/stellar";
import { EncounterTimeline } from "./EncounterTimeline";
import { StakePanel } from "./StakePanel";
import { TermsHashBadge } from "./TermsHashBadge";

export function EncounterCard({
  encounter,
  config,
}: {
  encounter: Encounter;
  config: AppConfig;
}) {
  const status = statusName(encounter.status);
  return (
    <article className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Encounter #{encounter.id.toString()}</h2>
        <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
      </div>
      <div style={{ height: 14 }} />
      <EncounterTimeline encounter={encounter} />
      <div style={{ height: 18 }} />
      <dl className="kv">
        <dt>Creator</dt>
        <dd>{shortAddress(encounter.creator)}</dd>
        <dt>Participant</dt>
        <dd>{shortAddress(encounter.participant)}</dd>
        <dt>Expires</dt>
        <dd>
          {new Date(Number(encounter.expires_at) * 1000).toLocaleString()} ·{" "}
          {formatDistanceToNowStrict(Number(encounter.expires_at) * 1000)}
        </dd>
        <dt>Commitment</dt>
        <dd>
          <TermsHashBadge hash={encounter.terms_hash} />
        </dd>
      </dl>
      <div style={{ height: 18 }} />
      <StakePanel stake={encounter.stake} asset={encounter.asset} symbol={config.assetSymbol} />
      <div style={{ height: 16 }} />
      <Link className="btn" href={`/encounter/${encounter.id.toString()}`}>
        Open encounter →
      </Link>
    </article>
  );
}
