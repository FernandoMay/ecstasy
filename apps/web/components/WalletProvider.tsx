"use client";

import {
  assertWalletNetwork,
  EcstasyService,
  FreighterWallet,
  getConfig,
  type AppConfig,
  type WalletAdapter,
} from "@ecstasy/stellar";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface WalletContextValue {
  config: AppConfig;
  address: string | null;
  connecting: boolean;
  error: string | null;
  service: EcstasyService;
  wallet: WalletAdapter;
  connect: () => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getConfig(), []);
  const wallet = useMemo(() => new FreighterWallet(), []);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => new EcstasyService(config, address ? wallet : null, address ?? undefined),
    [config, wallet, address],
  );

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (typeof window === "undefined" || !("freighter" in window)) {
        throw new Error("Freighter is not installed. Install the extension and reload.");
      }
      await assertWalletNetwork(wallet, config.networkPassphrase);
      const found = await wallet.requestAccess();
      setAddress(found);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setConnecting(false);
    }
  }, [wallet, config.networkPassphrase]);

  // Restore an already-approved session without prompting again.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await wallet.isConnected())) return;
        const found = await wallet.getAddress();
        if (!cancelled && found) setAddress(found);
      } catch {
        // Silent: the user can still press Connect.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  return (
    <WalletContext.Provider
      value={{
        config,
        address,
        connecting,
        error,
        service,
        wallet,
        connect,
        clearError: () => setError(null),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
