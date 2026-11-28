"use client";

import {
  FlowV2Client,
  FlowError,
  MilestonesV2Client,
  MilestoneV2Error,
  RoleRegistryV2Client,
  RoleError,
  VaultV2Client,
  VaultV2Error,
  shortAddress,
  type AppConfig,
  type WalletAdapter,
} from "@ecstasy/stellar";
import { EVIDENCE } from "@/lib/evidence";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const EXPLORER = "https://stellar.expert/explorer/testnet/tx/";
const tag = (value: unknown): string =>
  typeof value === "string" ? value : (value as { tag: string }).tag;
const xlm = (v: bigint) => (Number(v) / 10_000_000).toLocaleString();
const toBuffer = (hex: string) => Buffer.from(hex, "hex");

async function digest(text: string): Promise<string> {
  const bytes = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function clientOptions(config: AppConfig) {
  return {
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    allowHttp: config.rpcUrl.startsWith("http://"),
  };
}

interface Snapshot {
  vault: { id: string; attributed: string; owner: string; status: string } | null;
  milestone: { id: string; status: string; amount: string; delivery: string } | null;
  flow: { id: string; status: string; settlement: string; steps: string[] } | null;
  roles: Array<{ role: string; allowed: boolean }>;
}

export default function WorkbenchPage() {
  const { config, address, wallet, connect, connecting } = useWallet();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [label, setLabel] = useState("Service retainer");
  const [amount, setAmount] = useState("1");
  const [days, setDays] = useState("7");

  const load = useCallback(async () => {
    try {
      const o = clientOptions(config);
      const vault = new VaultV2Client({
        ...o, contractId: config.vaultV2ContractId, errorTypes: VaultV2Error,
      });
      const ms = new MilestonesV2Client({
        ...o, contractId: config.milestonesV2ContractId, errorTypes: MilestoneV2Error,
      });
      const flow = new FlowV2Client({
        ...o, contractId: config.flowV2ContractId, errorTypes: FlowError,
      });
      const rolesClient = new RoleRegistryV2Client({
        ...o, contractId: config.roleRegistryV2ContractId, errorTypes: RoleError,
      });
      const v = (await vault.get_vault({ vault_id: 1n })).result;
      const m = (await ms.get({ agreement_id: 1n })).result;
      const f = (await flow.get_flow({ flow_id: 1n })).result;
      const steps = (await flow.get_steps({ flow_id: 1n, offset: 0 })).result;
      const roleNames = ["fund_manager", "registrar", "resolver"];
      const roleChecks = address
        ? await Promise.all(
            roleNames.map(async (role) => ({
              role,
              allowed: (await rolesClient.has_role({ role, account: address })).result,
            })),
          )
        : roleNames.map((role) => ({ role, allowed: false }));
      setSnapshot({
        vault: v.isErr() ? null : {
          id: v.unwrap().id.toString(),
          attributed: xlm(v.unwrap().attributed),
          owner: v.unwrap().owner as string,
          status: tag(v.unwrap().status),
        },
        milestone: m.isErr() ? null : {
          id: m.unwrap().id.toString(),
          status: tag(m.unwrap().milestones[0]?.status ?? "—"),
          amount: xlm(m.unwrap().total),
          delivery: m.unwrap().milestones[0]?.evidence_hash == null
            ? "—"
            : shortAddress(Buffer.from(m.unwrap().milestones[0].evidence_hash!).toString("hex")),
        },
        flow: (() => {
          if (f.isErr()) return null;
          const flowValue = f.unwrap();
          return {
            id: flowValue.id.toString(),
            status: tag(flowValue.status),
            settlement: flowValue.settlement_tx == null
              ? "—"
              : Buffer.from(flowValue.settlement_tx).toString("hex"),
            steps: steps.map((s) => tag(s.step)),
          };
        })(),
        roles: roleChecks,
      });
    } catch {
      // keep previous snapshot
    }
  }, [config, address]);

  useEffect(() => { load(); }, [load]);

  async function run(name: string, build: (sign: WalletAdapter) => Promise<{ signAndSend: () => Promise<{ result: { isErr: () => boolean; unwrapErr: () => { message: string } } }> }>) {
    if (!address) { await connect(); return; }
    setBusy(name);
    setNotice(null);
    try {
      const sent = await build(wallet);
      const result = (await sent.signAndSend()).result;
      if (result.isErr()) throw new Error(result.unwrapErr().message);
      setNotice(`${name}: transacción enviada y confirmada.`);
      await load();
    } catch (cause) {
      setNotice(`${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setBusy(null);
    }
  }

  const visibleEvidence = EVIDENCE.filter((e) =>
    e.contract === config.vaultV2ContractId ||
    e.contract === config.milestonesV2ContractId ||
    e.contract === config.flowV2ContractId,
  ).slice(-12).reverse();

  function exportReceipt() {
    const receipt = {
      generated_at: new Date().toISOString(),
      network: config.network,
      contracts: {
        vault: config.vaultV2ContractId,
        milestones: config.milestonesV2ContractId,
        flow: config.flowV2ContractId,
        roles: config.roleRegistryV2ContractId,
      },
      snapshot,
      evidence: visibleEvidence.map((e) => ({
        feature: e.feature, function: e.functionName, hash: e.hash, contract: e.contract,
        url: EXPLORER + e.hash,
      })),
      note: "Datos leídos de contratos V2 en Stellar Testnet; hashes verificados en Horizon.",
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecstasy-v2-receipt.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const canFund = Boolean(address && snapshot?.roles.find((r) => r.role === "fund_manager")?.allowed);
  const canRegister = Boolean(address && snapshot?.roles.find((r) => r.role === "registrar")?.allowed);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Workbench<span>Escrow operativo sobre primitives V2</span>
        </h1>
        <p>
          Conecta tu wallet, crea y financia un vault, registra entregas, consulta permisos y exporta
          un comprobante. Cada acción firma una transacción real en Stellar Testnet.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={connect} disabled={connecting}>
            {address ? `Conectado ${shortAddress(address)}` : connecting ? "Conectando…" : "Conectar wallet"}
          </button>
          <button className="btn" onClick={exportReceipt}>Exportar comprobante</button>
        </div>
        {notice && <div className="notice" style={{ marginTop: 16 }}>{notice}</div>}
      </section>

      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Dashboard</h2>
          <p className="muted small">Estado leído en vivo de los contratos V2.</p>
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Vault</dt><dd>{snapshot?.vault ? `${snapshot.vault.id} · ${snapshot.vault.attributed} XLM · ${snapshot.vault.status}` : "—"}</dd>
            <dt>Hito</dt><dd>{snapshot?.milestone ? `${snapshot.milestone.id} · ${snapshot.milestone.status} · ${snapshot.milestone.amount} XLM` : "—"}</dd>
            <dt>Flujo</dt><dd>{snapshot?.flow ? `${snapshot.flow.id} · ${snapshot.flow.status} · ${snapshot.flow.steps.length} pasos` : "—"}</dd>
          </dl>
          <h3 style={{ marginTop: 18 }}>Tus permisos</h3>
          <ul className="muted small" style={{ listStyle: "none", padding: 0 }}>
            {snapshot?.roles.map((r) => (
              <li key={r.role}><strong>{r.role}</strong>: {r.allowed ? "autorizado" : "no autorizado"}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Flow Workspace</h2>
          <div className="field">
            <label className="label" htmlFor="wb-label">Etiqueta del vault</label>
            <input id="wb-label" className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="wb-amount">Importe (XLM)</label>
            <input id="wb-amount" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>
          <div className="field">
            <label className="label" htmlFor="wb-days">Vencimiento (días)</label>
            <input id="wb-days" className="input" value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" />
          </div>
          <div className="row">
            <button
              className="btn btn-small"
              disabled={busy !== null || !canFund}
              onClick={() => run("Crear vault", async (walletAdapter) => {
                const c = new VaultV2Client({
                  ...clientOptions(config), contractId: config.vaultV2ContractId,
                  publicKey: address!, signTransaction: walletAdapter.signTransaction,
                  errorTypes: VaultV2Error, allowHttp: config.rpcUrl.startsWith("http://"),
                });
                return c.create_vault({ caller: address!, label_hash: toBuffer(await digest(label)) });
              })}
            >
              {busy === "Crear vault" ? "Firmando…" : "Crear vault"}
            </button>
            <button
              className="btn btn-primary btn-small"
              disabled={busy !== null || !canFund}
              onClick={() => run("Financiar", async (walletAdapter) => {
                const c = new VaultV2Client({
                  ...clientOptions(config), contractId: config.vaultV2ContractId,
                  publicKey: address!, signTransaction: walletAdapter.signTransaction,
                  errorTypes: VaultV2Error, allowHttp: config.rpcUrl.startsWith("http://"),
                });
                return c.fund({ caller: address!, vault_id: 1n, amount: BigInt(Math.round(Number(amount) * 10_000_000)) });
              })}
            >
              {busy === "Financiar" ? "Firmando…" : "Financiar vault"}
            </button>
          </div>
          <p className="muted small" style={{ marginTop: 12 }}>
            {!address
              ? "Conecta la wallet para habilitar las acciones."
              : !canFund
                ? "Tu wallet no tiene el rol fund_manager: el contrato rechazará la firma."
                : "Rol fund_manager verificado en cadena. Las transacciones se firman con Freighter."}
          </p>
          <div className="row" style={{ marginTop: 14 }}>
            <button
              className="btn btn-small"
              disabled={busy !== null || !canRegister || !address}
              onClick={() => run("Crear hito", async (walletAdapter) => {
                const c = new MilestonesV2Client({
                  ...clientOptions(config), contractId: config.milestonesV2ContractId,
                  publicKey: address!, signTransaction: walletAdapter.signTransaction,
                  errorTypes: MilestoneV2Error, allowHttp: config.rpcUrl.startsWith("http://"),
                });
                return c.create({
                  caller: address!, recipient: address!,
                  amounts: [BigInt(Math.round(Number(amount) * 10_000_000))],
                  deadlines: [BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400)],
                  agreement_hash: toBuffer(await digest(`${label}-${amount}-${days}`)),
                });
              })}
            >
              {busy === "Crear hito" ? "Firmando…" : "Crear hito"}
            </button>
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            {canRegister
              ? "Rol registrar disponible para enlazar el hito al flujo."
              : "El rol registrar se valida en el contrato antes de enlazar pasos."}
          </p>
        </div>

        <div className="card">
          <h2>Evidence & Receipts</h2>
          <p className="muted small">Eventos y transacciones reales de los contratos V2.</p>
          <ul className="muted small" style={{ marginTop: 12 }}>
            {visibleEvidence.map((e) => (
              <li key={e.hash} style={{ marginBottom: 8 }}>
                <strong>{e.feature}</strong> · {e.functionName}<br />
                <a href={EXPLORER + e.hash} target="_blank" rel="noreferrer">{shortAddress(e.hash)} ↗</a>
              </li>
            ))}
          </ul>
          <button className="btn btn-small" onClick={exportReceipt}>Descargar comprobante JSON</button>
        </div>
      </div>
    </>
  );
}
