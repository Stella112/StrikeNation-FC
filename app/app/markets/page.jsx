"use client";

import { useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { arenaAbi, contracts, explorerTx } from "@/lib/contracts";

const markets = [
  { id: 1, title: "Will Nigeria FanDAO beat Brazil AI today?", pool: "Intent pool", odds: "YES", type: "Arena Match", countryA: 1, countryB: 2 },
  { id: 2, title: "Will Japan FanDAO enter top 3 after the next round?", pool: "Intent pool", odds: "YES", type: "Leaderboard", countryA: 6, countryB: 3 },
  { id: 3, title: "Will an Underdog squad score two or more goals?", pool: "Intent pool", odds: "NO", type: "Performance", countryA: 5, countryB: 1 },
  { id: 4, title: "Will England keep a clean sheet against Japan?", pool: "Intent pool", odds: "YES", type: "Match Event", countryA: 4, countryB: 6 },
];

export default function MarketsPage() {
  const { isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState();
  const [error, setError] = useState("");
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function submitMarketAction(market, action) {
    setError("");
    if (!isConnected) {
      setError("Connect OKX Wallet first.");
      return;
    }

    try {
      const strategyHash = keccak256(stringToHex(`${action}:${market.id}:${market.title}:${Date.now()}`));
      const txHash =
        action === "intent"
          ? await writeContractAsync({
              address: contracts.StrikeNationArena,
              abi: arenaAbi,
              functionName: "proposeExchangeOSMarket",
              args: [0n, market.countryA, market.countryB, market.title, strategyHash],
            })
          : await writeContractAsync({
              address: contracts.StrikeNationArena,
              abi: arenaAbi,
              functionName: "placePrediction",
              args: [market.countryA, market.countryB, action === "yes"],
            });

      setHash(txHash);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Market transaction rejected.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Open Markets</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            On-chain prediction actions and Exchange OS-ready market intents
          </p>
        </div>
      </div>

      {(error || hash) && (
        <div className="border border-border bg-card p-4 font-mono text-[10px] uppercase tracking-widest">
          {error && <p className="text-destructive">{error}</p>}
          {hash && (
            <a className="text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              View market transaction
            </a>
          )}
          {isConfirming && <p className="mt-2 text-muted-foreground">Waiting for X Layer confirmation...</p>}
          {isSuccess && <p className="mt-2 text-success">Confirmed on X Layer.</p>}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <div key={market.id} className="flex flex-col justify-between border border-border bg-card p-5 hover:border-primary/50 transition-colors">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest bg-muted px-2 py-1 mb-3 inline-block">{market.type}</span>
              <p className="font-display text-xl uppercase italic mb-4">{market.title}</p>
              <p className="text-xs text-muted-foreground">
                Agents can post this as an on-chain market intent today. Exchange OS routing can attach when venue access opens.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Pool</span>
                  <span className="font-display text-xl">{market.pool}</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">AI: {market.odds}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button disabled={isPending || isConfirming} onClick={() => submitMarketAction(market, "yes")} className="bg-muted px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground disabled:opacity-50">
                  Back Yes
                </button>
                <button disabled={isPending || isConfirming} onClick={() => submitMarketAction(market, "no")} className="bg-muted px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background disabled:opacity-50">
                  Back No
                </button>
                <button disabled={isPending || isConfirming} onClick={() => submitMarketAction(market, "intent")} className="bg-primary px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
                  Post Intent
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
