"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, keccak256, stringToHex } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MatchSimulation } from "../MatchSimulation";
import { agentAbi, arenaAbi, contracts, explorerTx } from "@/lib/contracts";

const opponents = [
  { id: 2, name: "Brazil AI", difficulty: "Hard", reward: "Higher Points", desc: "Creative pressure and late overloads." },
  { id: 3, name: "Argentina AI", difficulty: "Medium", reward: "Normal Points", desc: "Calm finishing and possession control." },
  { id: 6, name: "Japan AI", difficulty: "Technical", reward: "Tempo Bonus", desc: "Fast rotations and tactical discipline." },
];

export default function QuickBattlePage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [step, setStep] = useState(1);
  const [opponent, setOpponent] = useState(opponents[0]);
  const [recommendation, setRecommendation] = useState(null);
  const [hash, setHash] = useState();
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const { data: squad = [] } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "squadOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const agentId = useMemo(() => (squad?.length ? squad[0] : undefined), [squad]);

  useEffect(() => {
    if (!isSuccess || !receipt) return;

    for (const log of receipt.logs || []) {
      try {
        const decoded = decodeEventLog({ abi: arenaAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "AgentMatchSettled") {
          setResult({
            won: decoded.args.won,
            scoreUser: Number(decoded.args.scoreUser),
            scoreAgent: Number(decoded.args.scoreAgent),
            points: decoded.args.points?.toString(),
          });
        }
      } catch {}
    }

    setStep(4);
  }, [isSuccess, receipt]);

  async function getStrategy() {
    setError("");
    const response = await fetch("/api/agent/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentName: "Naija Finisher",
        country: "Nigeria",
        opponent: opponent.name,
        playstyle: "4-3-3 AI Captain",
        record: "on-chain squad",
      }),
    });
    const data = await response.json();
    setRecommendation(data);
    setStep(3);
  }

  async function startOnchainBattle() {
    setError("");
    if (!isConnected) {
      setError("Connect OKX Wallet first.");
      return;
    }
    if (!agentId) {
      setError("Mint your 11-player squad before starting a real battle.");
      return;
    }

    const power = Math.max(40, Math.min(100, Number(recommendation?.power || 78)));
    const strategyHash = keccak256(
      stringToHex(`quick:${address}:${agentId.toString()}:${opponent.id}:${power}:${Date.now()}`),
    );

    try {
      const txHash = await writeContractAsync({
        address: contracts.StrikeNationArena,
        abi: arenaAbi,
        functionName: "battleAgent",
        args: [agentId, opponent.id, strategyHash, power, recommendation?.marketMove !== "NO"],
      });
      setHash(txHash);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Battle transaction rejected.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase italic mb-2">Quick Battle</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Real X Layer settlement first. 60-second broadcast after confirmation.
        </p>
      </div>

      {(error || hash) && (
        <div className="mb-6 border border-border bg-card p-4 font-mono text-[10px] uppercase tracking-widest">
          {error && <p className="text-destructive">{error}</p>}
          {hash && (
            <a className="text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              View battle transaction
            </a>
          )}
          {isConfirming && <p className="mt-2 text-muted-foreground">Waiting for X Layer to settle the match...</p>}
        </div>
      )}

      {step < 4 && (
        <div className="mb-8">
          <MatchSimulation preview onComplete={() => {}} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Select AI Opponent</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {opponents.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpponent(item)}
                className={`text-left p-5 border transition-colors ${opponent.id === item.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-foreground/50"}`}
              >
                <h3 className="font-display text-xl uppercase italic mb-1">{item.name}</h3>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-4">{item.difficulty}</div>
                <p className="text-xs mb-4">{item.desc}</p>
                <div className="font-mono text-[10px] uppercase tracking-widest text-success">{item.reward}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm">
            Choose Opponent
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Claude Strategy</h2>
          <div className="border border-primary/20 bg-primary/5 p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Claude will read your opponent and produce a strategy hash. The final battle is submitted to the deployed StrikeNationArena contract.
            </p>
            <button onClick={getStrategy} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm">
              Generate Strategy
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Confirm On-Chain Match</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border bg-card p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Opponent</div>
              <div className="font-display text-2xl uppercase italic mb-6">{opponent.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest">Agent ID: {agentId ? agentId.toString() : "Mint squad first"}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-2">Network: X Layer Mainnet</div>
            </div>
            <div className="border border-primary/20 bg-primary/5 p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">Claude Call</div>
              <p className="text-sm italic mb-4">"{recommendation?.reason}"</p>
              <div className="font-mono text-[10px] uppercase tracking-widest">
                {recommendation?.direction} / {recommendation?.power} power / {recommendation?.risk} risk
              </div>
            </div>
          </div>
          <button disabled={isPending || isConfirming} onClick={startOnchainBattle} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm disabled:opacity-50">
            {isPending || isConfirming ? "Settling on X Layer..." : "Start Match on X Layer"}
          </button>
        </div>
      )}

      {step === 4 && <MatchSimulation result={result} onComplete={() => setStep(5)} />}

      {step === 5 && (
        <div className="space-y-10 text-center py-8">
          <div className="space-y-2">
            <h2 className={`font-display text-6xl uppercase italic ${result?.won ? "text-success" : "text-destructive"}`}>
              {result?.won ? "Victory" : "Full Time"}
            </h2>
            <div className="font-display text-4xl">
              Nigeria {result?.scoreUser ?? "-"} - {result?.scoreAgent ?? "-"} {opponent.name}
            </div>
          </div>
          <div className="max-w-2xl mx-auto border border-primary/20 bg-primary/5 p-6 text-left">
            <h3 className="font-display text-xl uppercase italic mb-3">Agent Evolution</h3>
            <p className="text-sm text-muted-foreground">
              The deployed contract recorded this battle against your agent NFT. Wins move agents toward Silver and Gold levels.
            </p>
            {hash && (
              <a className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
                Open X Layer receipt
              </a>
            )}
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <button onClick={() => { setStep(1); setHash(undefined); setResult(null); }} className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-sm">
              Battle Again
            </button>
            <Link href="/app" className="border border-border bg-background font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
