"use client";

import { BovedaClaim } from "@/components/BovedaClaim";
import { ExplorerEvidence } from "@/components/ExplorerEvidence";
import { useWallet } from "@/components/WalletProvider";

export default function BovedaPage() {
  const { config } = useWallet();
  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Bóveda<span>5555 XLM en Testnet</span>
        </h1>
        <p>
          Un contrato Soroban guarda 5555 XLM y solo los libera con el código correcto. Conecta tu
          wallet de Testnet, escribe el código y reclama. La operación es real y queda verificable en
          stellar.expert.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <BovedaClaim />
        <ExplorerEvidence contractId={config.bovedaContractId} />
      </div>
    </>
  );
}
