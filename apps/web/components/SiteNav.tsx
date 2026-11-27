"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; links: NavLink[] };

const GROUPS: NavGroup[] = [
  {
    label: "Protocolo",
    links: [
      { href: "/encounters", label: "Encuentros" },
      { href: "/vault", label: "Vault" },
      { href: "/boveda", label: "Bóveda" },
      { href: "/analytics", label: "Analítica" },
      { href: "/activity", label: "Actividad" },
      { href: "/afterglow", label: "Afterglow" },
      { href: "/notifications", label: "Avisos" },
    ],
  },
  {
    label: "Escrow y pagos",
    links: [
      { href: "/refunds", label: "Reembolsos" },
      { href: "/recovery", label: "Recuperación" },
      { href: "/arbitration", label: "Arbitraje" },
      { href: "/milestones", label: "Hitos" },
      { href: "/panel-arbitration", label: "Panel 2/3" },
      { href: "/streaming", label: "Streaming" },
      { href: "/subscriptions", label: "Suscripciones" },
    ],
  },
  {
    label: "Confianza",
    links: [
      { href: "/disputes", label: "Disputas" },
      { href: "/evidence", label: "Evidencia" },
      { href: "/reputation", label: "Reputación" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/encounters") return pathname.startsWith("/encounter/");
  return false;
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav" aria-label="Navegación principal">
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="nav-groups"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="nav-toggle-dots" aria-hidden="true">
          •••
        </span>
        Menú
      </button>
      <div id="nav-groups" className={`nav-groups${open ? " nav-groups-open" : ""}`}>
        {GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-group-label">{group.label}</span>
            <div className="nav-links">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
