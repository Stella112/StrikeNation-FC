"use client";

import { useEffect, useMemo, useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { arenaAbi, contracts, explorerAddress, explorerTx } from "@/lib/contracts";

const marketTemplates = [
  { id: 1, title: "Will Nigeria FanDAO beat Brazil AI today?", type: "Arena Match", countryA: 1, countryB: 2 },
  { id: 2, title: "Will Japan FanDAO enter top 3 after the next round?", type: "Leaderboard", countryA: 6, countryB: 3 },
  { id: 3, title: "Will an Underdog squad score two or more goals?", type: "Performance", countryA: 5, countryB: 1 },
  { id: 4, title: "Will England keep a clean sheet against Japan?", type: "Match Event", countryA: 4, countryB: 6 },
];

const countryNames = {
  1: "Nigeria",
  2: "Brazil",
  3: "Argentina",
  4: "England",
  5: "Underdog",
  6: "Japan",
  7: "South Korea",
  8: "Saudi Arabia",
  9: "Qatar",
  10: "Iran",
  11: "Australia",
  12: "Indonesia",
  13: "India",
  14: "China",
};

function shortAddress(address) {
  if (!address) return "unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeIntent(result) {
  if (!result) return null;
  return {
    proposer: result.proposer ?? result[0],
    courtMatchId: result.courtMatchId ?? result[1],
    countryA: result.countryA ?? result[2],
    countryB: result.countryB ?? result[3],
    question: result.question ?? result[4],
    agentStrategyHash: result.agentStrategyHash ?? result[5],
    createdAt: result.createdAt ?? result[6],
  };
}

function formatTime(timestamp) {
  if (!timestamp) return "unknown";
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export default function MarketsPage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState();
  const [error, setError] = useState("");
  const [intents, setIntents] = useState([]);
  const [loadingIntents, setLoadingIntents] = useState(false);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function loadIntents() {
    if (!publicClient) return;
    setLoadingIntents(true);
    try {
      const count = await publicClient.readContract({
        address: contracts.StrikeNationArena,
        abi: arenaAbi,
        functionName: "marketIntentCount",
      });

      const ids = [];
      for (let id = count; id > 0n && ids.length < 20; id -= 1n) ids.push(id);

      const rows = await Promise.all(
        ids.map(async (id) => {
          const result = await publicClient.readContract({
            address: contracts.StrikeNationArena,
            abi: arenaAbi,
            functionName: "marketIntents",
            args: [id],
          });
          return { id, ...normalizeIntent(result) };
        }),
      );

      setIntents(rows.filter((row) => row.proposer));
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Could not read on-chain market intents.");
    } finally {
      setLoadingIntents(false);
    }
  }

  useEffect(() => {
    loadIntents();
    const timer = setInterval(loadIntents, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient]);

  useEffect(() => {
    if (isSuccess) loadIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

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

  const hasIntents = intents.length > 0;

  return (
    <div className="mx-auto max-w-[1560px] p-5 md:p-10 space-y-8">
      <section className="border-b border-border pb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Exchange OS-ready</div>
        <h1 className="mt-3 font-display text-5xl uppercase italic leading-none md:text-7xl">
          Market <span className="text-primary">Intents</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          Intents are on-chain proposals for outcome markets. They are not full Exchange OS order books yet; they record the agent question, countries, proposer wallet, strategy hash, and timestamp on X Layer.
        </p>
      </section>

      {(error || hash) && (
        <div className="border border-border bg-card p-4 font-mono text-[10px] uppercase tracking-widest">
          {error && <p className="text-destructive">{error}</p>}
          {hash && (
            <a className="text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              View market transaction
            </a>
          )}
          {isConfirming && <p className="mt-2 text-muted-foreground">Waiting for X Layer confirmation...</p>}
          {isSuccess && <p className="mt-2 text-success">Confirmed on X Layer. Intent book refreshes automatically.</p>}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-4">
        {marketTemplates.map((market) => (
          <div key={market.id} className="flex flex-col justify-between border border-border bg-card p-5 hover:border-primary/50 transition-colors">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest bg-muted px-2 py-1 mb-3 inline-block">{market.type}</span>
              <p className="font-display text-2xl uppercase italic leading-none mb-4">{market.title}</p>
              <p className="text-sm text-muted-foreground">
                Posts a real `ExchangeOSMarketIntent` to StrikeNationArena.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
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
        ))}
      </section>

      <section className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-3xl uppercase italic">On-chain Intent Book</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {loadingIntents ? "Reading StrikeNationArena..." : `${intents.length} intents found`}
            </p>
          </div>
          <button onClick={loadIntents} className="border border-border bg-background px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-muted">
            Refresh
          </button>
        </div>

        {hasIntents ? (
          <div>
            {intents.map((intent) => (
              <div key={intent.id.toString()} className="grid gap-4 border-b border-border px-5 py-5 last:border-b-0 lg:grid-cols-[90px_1fr_180px_180px]">
                <div>
                  <div className="font-display text-3xl uppercase italic text-primary">#{intent.id.toString()}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Intent</div>
                </div>
                <div>
                  <p className="text-lg font-bold">{intent.question}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {countryNames[Number(intent.countryA)] || `Country ${Number(intent.countryA)}`} vs {countryNames[Number(intent.countryB)] || `Country ${Number(intent.countryB)}`} / Match #{intent.courtMatchId.toString()}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Strategy {intent.agentStrategyHash.slice(0, 10)}...{intent.agentStrategyHash.slice(-6)}
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Proposer</div>
                  <a href={explorerAddress(intent.proposer)} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary hover:underline">
                    {shortAddress(intent.proposer)}
                  </a>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Created</div>
                  <div className="text-sm">{formatTime(intent.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            No on-chain intents yet. Post Intent will create the first real `marketIntents(id)` record.
          </div>
        )}
      </section>
    </div>
  );
}
