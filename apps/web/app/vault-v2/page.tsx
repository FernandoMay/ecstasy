"use client";

import { VaultV2Client, VaultV2Error, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear vault A", "5130769fc71704db5e61a2c6424739f9f67b16ebae15109c49dc2d6f0d082f31"],
  ["Crear vault B", "6db6a8950bc7452e7383a8c984d2a02bdb661c4305b2b2fa92008a011ad2bf97"],
  ["Fondear A", "895b4887b22c581e55737769aa1a3d8156980c79d68123e41c77f9c057e1b783"],
  ["Fondear B", "86dea8c4f0f1d8467e3d6ff2c8d370382c65b39b352a3bd8dd6c879902864443"],
  ["Transferencia directa", "99eec7ffd70cb6f92c48e848aa8d782507841ee7d89affcc2b1b6b8a503ea180"],
  ["Sweep surplus", "fcce58300f3a6ecfcc28bd8bc7aa287912a3b6f7e42fc53a3e63419c1d56593c"],
  ["Retiro A", "653494dd0200152b5a591deafd2f1e1b134e78c3ce122c9ba2bff463f1e46558"],
  ["Retiro B", "12a2a2eb134967632e9ebe8950b7f4ea62a96da6c6d6832362af9405bece1346"],
] as const;

const stroops = (value: bigint) => (Number(value) / 10_000_000).toLocaleString();

export default function VaultV2Page() {
  const { config } = useWallet();
  const [va, setVa] = useState<string | null>(null);
  const [vb, setVb] = useState<string | null>(null);
  const [total, setTotal] = useState<string | null>(null);
  const [surplus, setSurplus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const client = new VaultV2Client({
          contractId: config.vaultV2ContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: VaultV2Error,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const a = (await client.get_vault({ vault_id: 1n })).result;
        const b = (await client.get_vault({ vault_id: 2n })).result;
        if (!a.isErr()) setVa(stroops(a.unwrap().attributed));
        if (!b.isErr()) setVb(stroops(b.unwrap().attributed));
        setTotal(stroops((await client.get_total_attributed()).result));
        setSurplus(stroops((await client.get_surplus()).result));
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Vault V2<span>El creador retira solo lo que el contrato le atribuye</span>
        </h1>
        <p>
          La ruta oficial `fund` mueve XLM y atribución en la misma transacción. Una transferencia
          directa no crea atribución: es surplus y solo puede ir al destino fijado en el constructor.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Estado real</h2>
          <dl className="kv">
            <dt>Atribución A</dt><dd>{va ?? "—"} XLM</dd>
            <dt>Atribución B</dt><dd>{vb ?? "—"} XLM</dd>
            <dt>Total atribuido</dt><dd>{total ?? "—"} XLM</dd>
            <dt>Surplus</dt><dd>{surplus ?? "—"} XLM</dd>
          </dl>
          <p className="muted small" style={{ marginTop: 14 }}>
            Tras el ataque SEC-04 contra V2: retiro por encima de la atribución rechazado (#5) y
            retiro del vault ajeno rechazado (#2), ambos en simulación sin hash. Los 2 XLM no
            atribuidos fueron enviados al destino declarado.
          </p>
          <h3 style={{ marginTop: 16 }}>Reconciliación</h3>
          <p className="muted small">
            3 XLM por `fund` + 2 XLM directos = 5 XLM → 2 XLM al destino de surplus, 2 XLM a A,
            1 XLM a B. Saldo final del contrato: 0. Los 5.555 XLM de V1 no se tocaron.
          </p>
        </div>
        <div className="card">
          <h2>Transacciones reales</h2>
          <ul className="muted small">
            {TXS.map(([label, hash]) => (
              <li key={hash} style={{ marginBottom: 8 }}>
                {label}:{" "}
                <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer">
                  {shortAddress(hash)} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
