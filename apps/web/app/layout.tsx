import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { WalletStatus } from "@/components/WalletStatus";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "ECSTASY — Private encounters. Public proof.",
  description:
    "A consent-first private-agreement protocol on Stellar. Private terms stay off-chain; the agreed state transition settles on-chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <WalletProvider>
          <div className="shell">
            <header className="site-header">
              <div className="header-top">
                <div className="brand">
                  <Link href="/" className="wordmark">
                    ECSTASY
                  </Link>
                  <span className="brand-sub">Protocolo de acuerdos privados sobre Stellar</span>
                </div>
                <WalletStatus />
              </div>
              <SiteNav />
            </header>
            <main id="contenido">{children}</main>
            <footer className="footer">
              <div className="footer-grid">
                <div>
                  <strong>ECSTASY</strong>
                  <p>
                    Acuerdos privados con liquidación verificable en Stellar Testnet. Los términos
                    confidenciales nunca se escriben en la cadena.
                  </p>
                </div>
                <div>
                  <span className="nav-group-label">Verificación</span>
                  <p>
                    <Link href="/evidence">Evidencia</Link> · <Link href="/activity">Actividad</Link> ·{" "}
                    <Link href="/reputation">Reputación</Link>
                  </p>
                </div>
                <div>
                  <span className="nav-group-label">Límites</span>
                  <p>
                    Un hash es un compromiso, no cifrado. El estado on-chain prueba una transición
                    acordada, no que un evento del mundo real sea objetivamente verdadero.
                  </p>
                </div>
              </div>
              <div className="footer-bottom">
                <span>Testnet · Sin fondos de usuarios en Mainnet</span>
                <span>Private by default. Settled on Stellar.</span>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
