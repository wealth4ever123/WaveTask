'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface WalletCtx {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Ctx = createContext<WalletCtx>({ address: null, connect: async () => {}, disconnect: () => {} });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      // Use Freighter API directly (window.freighter)
      const freighter = (window as any).freighter;
      if (!freighter) {
        alert('Please install Freighter wallet extension');
        return;
      }
      await freighter.setAllowed();
      const { publicKey } = await freighter.getPublicKey();
      setAddress(publicKey);
    } catch (err) {
      console.error('Wallet connect failed', err);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return <Ctx.Provider value={{ address, connect, disconnect }}>{children}</Ctx.Provider>;
}

export const useWallet = () => useContext(Ctx);
