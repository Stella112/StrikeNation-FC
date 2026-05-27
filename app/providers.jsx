"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { xLayer } from "@/lib/contracts";

export function Providers({ children }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const config = useMemo(
    () =>
      createConfig({
        chains: [xLayer],
        connectors: [injected({ target: "metaMask" }), injected()],
        transports: {
          [xLayer.id]: http("https://rpc.xlayer.tech"),
        },
        ssr: true,
      }),
    [],
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
