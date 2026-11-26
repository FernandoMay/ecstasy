"use client";

import {
  assertWalletNetwork,
  connectWallet,
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
  connect: () => Promise<string | null>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getConfig(), []);
  const wallet = useMemo(() => new FreighterWallet(), []);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);

  const service = useMemo(
    () => new EcstasyService(config, address ? wallet : null, address ?? undefined),
    [config, wallet, address],
  );

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      // Modern Freighter communicates over postMessage and does not inject
      // `window.freighter`, so ask the SDK instead of probing a global.
      if (typeof window === "undefined" || !(await wallet.isConnected())) {
        throw new Error("Freighter is not installed or locked. Install/unlock it and retry.");
      }
      // requestAccess must precede getNetwork: the wallet only reports its
      // network after the site has been authorized.
      const found = await connectWallet(wallet, config.networkPassphrase);
      setAddress(found);
      setNetworkMismatch(false);
      return found;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return null;
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
        await assertWalletNetwork(wallet, config.networkPassphrase);
        const found = await wallet.getAddress();
        if (!cancelled && found) setAddress(found);
      } catch {
        // Silent: the user can still press Connect.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet, config.networkPassphrase]);

  // React to account/network switches made inside Freighter while the app is open.
  useEffect(() => {
    return wallet.watchChanges(({ address: nextAddress, networkPassphrase }) => {
      if (networkPassphrase !== config.networkPassphrase) {
        setAddress(null);
        setNetworkMismatch(true);
        setError("Wallet switched to another network. Switch back to Testnet and reconnect.");
        return;
      }
      setNetworkMismatch(false);
      setAddress(nextAddress || null);
    });
  }, [wallet, config.networkPassphrase]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetworkMismatch(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await assertWalletNetwork(wallet, config.networkPassphrase);
      const found = await wallet.getAddress();
      if (!found) {
        disconnect();
        return;
      }
      setAddress(found);
      setNetworkMismatch(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [wallet, config.networkPassphrase, disconnect]);

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
        disconnect,
        refresh,
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
