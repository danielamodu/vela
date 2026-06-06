"use client";

/**
 * Providers.tsx — Client-side providers wrapper
 *
 * @mysten/dapp-kit requires "use client" and wraps:
 * - QueryClientProvider (TanStack React Query)
 * - SuiClientProvider (Sui network config)
 * - WalletProvider (wallet connection)
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";

const networks = {
  testnet: { url: "/api/sui" },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s
        retry: 2,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
