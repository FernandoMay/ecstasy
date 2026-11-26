import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { WalletStatus } from "@/components/WalletStatus";

export const metadata: Metadata = {
  title: "ECSTASY — Private encounters. Public proof.",
  description:
    "A consent-first private-agreement protocol on Stellar. Private terms stay off-chain; the agreed state transition settles on-chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <div className="shell">
            <header className="topbar">
              <Link href="/" className="wordmark">
                ECSTASY
              </Link>
              <nav className="row small">
                <Link href="/boveda">Bóveda</Link>
              </nav>
              <WalletStatus />
            </header>
            {children}
            <footer className="footer">
              Private by default. Settled on Stellar. &nbsp;·&nbsp; A hash is a commitment, not
              encryption. &nbsp;·&nbsp; On-chain state proves an agreed transition, not that a
              real-world event was objectively true.
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
