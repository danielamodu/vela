"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";

/** Vela star-compass SVG logo mark */
function VelaLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="14" cy="14" r="13" stroke="#000000" strokeWidth="1.5" opacity="0.1" />
      {/* Star / compass points */}
      <path
        d="M14 3L15.5 12.5L25 14L15.5 15.5L14 25L12.5 15.5L3 14L12.5 12.5L14 3Z"
        fill="#000000"
      />
      {/* Inner dot */}
      <circle cx="14" cy="14" r="2" fill="#ffffff" />
    </svg>
  );
}

function CustomWalletButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [open, setOpen] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  if (account) {
    return (
      <div style={{ position: "relative" }}>
        <button 
          onClick={() => setOpen(!open)}
          style={{
            background: "var(--color-surface-mist)",
            borderRadius: "20px",
            padding: "6px 12px",
            fontSize: "14px",
            color: "var(--color-ink-black)",
            border: "none",
            outline: "none",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            fontFamily: "var(--font-suisseintl)",
            fontWeight: 500,
            transition: "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)",
            transform: open ? "scale(0.97)" : "scale(1)",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = open ? "scale(0.97)" : "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = open ? "scale(0.97)" : "scale(1)")}
        >
          {truncate(account.address)}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ color: "var(--color-graphite)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "160px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            transformOrigin: "top right",
          }}
          className="dropdown-enter-active"
        >
            <Link 
              href={`/profile/${account.address}`}
              onClick={() => setOpen(false)}
              className="dropdown-item"
            >
              Profile
            </Link>
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="dropdown-item dropdown-item-danger"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <ConnectModal
      trigger={
        <button className="wallet-btn-disconnected">
          Connect Wallet
        </button>
      }
      open={open}
      onOpenChange={setOpen}
    />
  );
}

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Browse" },
    { href: "/upload", label: "Upload" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <div style={styles.headerWrapper}>
      <header style={styles.header} className="navbar-header">
        {/* Left: Logo */}
        <Link href="/" style={styles.brand} aria-label="Vela home">
          <VelaLogo />
          <span style={styles.brandText}>Vela</span>
        </Link>

        {/* Center: Nav links */}
        <nav style={styles.nav} aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Badge & Wallet connect */}
        <div style={styles.walletWrapper}>
          <div style={styles.tatumBadge} className="navbar-tatum-badge">Powered by Tatum</div>
          <CustomWalletButton />
        </div>
      </header>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "24px 24px 0",
    display: "flex",
    justifyContent: "center",
  },
  header: {
    background: "var(--color-pure-white)",
    borderRadius: "var(--radius-nav-pill)",
    height: "64px",
    width: "100%",
    maxWidth: "var(--page-max-width)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px 0 24px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    flexShrink: 0,
  },
  brandText: {
    fontFamily: "var(--font-suisseintl)",
    fontSize: "16px",
    fontWeight: 500,
    color: "var(--color-ink-black)",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    justifyContent: "center",
  },
  navLink: {
    padding: "6px 12px",
    fontFamily: "var(--font-suisseintl)",
    fontSize: "15px",
    fontWeight: 500,
    color: "var(--color-graphite)",
    textDecoration: "none",
    transition: "color var(--transition)",
    letterSpacing: "-0.2px",
  },
  navLinkActive: {
    color: "var(--color-ink-black)",
  },
  walletWrapper: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  tatumBadge: {
    fontFamily: "var(--font-suisseintlmono)",
    fontSize: "11px",
    color: "var(--color-graphite)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};
