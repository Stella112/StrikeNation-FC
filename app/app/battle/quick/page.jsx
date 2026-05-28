"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, keccak256, stringToHex } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MatchSimulation } from "../MatchSimulation";
import { agentAbi, arenaAbi, contracts, explorerTx } from "@/lib/contracts";

const countries = [
  { id: 1, code: "NG", name: "Nigeria", difficulty: "Home", reward: "Practice Points", desc: "Underdog speed and direct pressure." },
  { id: 2, code: "BR", name: "Brazil", difficulty: "Hard", reward: "Higher Points", desc: "Creative pressure and late overloads." },
  { id: 3, code: "AR", name: "Argentina", difficulty: "Medium", reward: "Normal Points", desc: "Calm finishing and possession control." },
  { id: 4, code: "EN", name: "England", difficulty: "Set Piece", reward: "Tactical Points", desc: "Dead-ball pressure and physical duels." },
  { id: 5, code: "UD", name: "Underdog", difficulty: "Random", reward: "Chaos Bonus", desc: "Unpredictable agents and risky counters." },
  { id: 6, code: "JP", name: "Japan", difficulty: "Technical", reward: "Tempo Bonus", desc: "Fast rotations and tactical discipline." },
  { id: 7, code: "KR", name: "South Korea", difficulty: "Press", reward: "Press Bonus", desc: "High pressing and rapid transitions." },
  { id: 8, code: "SA", name: "Saudi Arabia", difficulty: "Counter", reward: "Counter Bonus", desc: "Deep blocks and sudden forward runs." },
  { id: 9, code: "QA", name: "Qatar", difficulty: "Host Nerve", reward: "Composure Points", desc: "Compact defense and patient buildup." },
  { id: 10, code: "IR", name: "Iran", difficulty: "Defensive", reward: "Block Bonus", desc: "Low block, aerial strength, and counters." },
  { id: 11, code: "AU", name: "Australia", difficulty: "Physical", reward: "Duel Bonus", desc: "Strong duels and early crosses." },
  { id: 12, code: "ID", name: "Indonesia", difficulty: "Rising", reward: "Momentum Bonus", desc: "High crowd energy and quick wide play." },
  { id: 13, code: "IN", name: "India", difficulty: "Rising", reward: "Crowd Bonus", desc: "Patient buildup and long-range attempts." },
  { id: 14, code: "CN", name: "China", difficulty: "Pressure", reward: "Structure Bonus", desc: "Organized pressure and central overloads." },
];

export default function QuickBattlePage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [step, setStep] = useState(1);
  const [opponent, setOpponent] = useState(countries[1]);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedPool, setSelectedPool] = useState([2]);
  const [recommendation, setRecommendation] = useState(null);
  const [hash, setHash] = useState();
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [footballContext, setFootballContext] = useState(null);
  const [agentNames, setAgentNames] = useState([]);

  const { data: squad = [] } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "squadOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const agentId = useMemo(() => (squad?.length ? squad[0] : undefined), [squad]);
  const primaryAgentName = agentNames[9] || agentNames[0] || "Naija Finisher";
  const filteredCountries = useMemo(
    () =>
      countries.filter((country) =>
        `${country.code} ${country.name} ${country.desc}`.toLowerCase().includes(countrySearch.toLowerCase()),
      ),
    [countrySearch],
  );

  function toggleCountry(country) {
    setOpponent(country);
    setSelectedPool((current) =>
      current.includes(country.id) ? current.filter((id) => id !== country.id) : [...current, country.id],
    );
  }

  useEffect(() => {
    let active = true;
    fetch("/api/football/context")
      .then((response) => response.json())
      .then((data) => {
        if (active) setFootballContext(data);
      })
      .catch(() => {
        if (active) setFootballContext(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(`strikenation:agent-names:${address || "guest"}`);
    if (!saved) {
      setAgentNames([]);
      return;
    }

    try {
      setAgentNames(JSON.parse(saved));
    } catch {
      setAgentNames([]);
    }
  }, [address]);

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
        agentName: primaryAgentName,
        agentNames,
        country: "Nigeria",
        opponent: `${opponent.name} AI`,
        playstyle: "4-3-3 AI Captain",
        record: "on-chain squad",
        fixtureContext: footballContext,
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
      stringToHex(`quick:${address}:${agentId.toString()}:${opponent.id}:${selectedPool.join("-")}:${power}:${Date.now()}`),
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

      <div className="mb-8 border border-border bg-card">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">World Cup Signal</p>
            <h2 className="font-display text-2xl uppercase italic">Upcoming Fixtures Feed</h2>
            <p className="text-xs text-muted-foreground">
              {footballContext?.source === "api-football"
                ? "Live API-Football data is feeding Claude strategy."
                : "Waiting for API-Football key; using safe World Cup preview context."}
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            League {footballContext?.leagueId || "1"} / Season {footballContext?.season || "2026"}
          </div>
        </div>
        <div className="border-t border-border overflow-hidden">
          <div className="flex gap-6 whitespace-nowrap px-5 py-3 font-mono text-[10px] uppercase tracking-widest animate-[ticker_22s_linear_infinite]">
            {(footballContext?.ticker || ["Loading World Cup fixtures..."]).map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {(footballContext?.fixtures || []).slice(0, 3).map((fixture) => (
            <div key={fixture.id} className="bg-card p-4">
              <div className="font-display text-xl uppercase italic">
                {fixture.home?.code || fixture.home?.name?.slice(0, 3)} vs {fixture.away?.code || fixture.away?.name?.slice(0, 3)}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-2">
                {fixture.round} / {fixture.status}
              </div>
              <div className="text-xs text-muted-foreground mt-2">{fixture.venue}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid md:grid-cols-2 gap-4">
        <div className="border border-primary bg-primary/10 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">Agent Mode</p>
          <h2 className="font-display text-2xl uppercase italic mb-2">Battle AI Country Squad</h2>
          <p className="text-sm text-muted-foreground">Select one or more rival countries. Claude reads the pool; the on-chain battle settles against the active rival.</p>
        </div>
        <Link href="/app/battle/pvp" className="border border-border bg-card p-5 hover:border-secondary transition-colors">
          <p className="font-mono text-[10px] uppercase tracking-widest text-secondary mb-2">PvP Challenge</p>
          <h2 className="font-display text-2xl uppercase italic mb-2">Wallet vs Wallet</h2>
          <p className="text-sm text-muted-foreground">Create or join a real two-wallet court match on X Layer.</p>
        </Link>
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

      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl uppercase italic">Select Rival Country</h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Active rival: {opponent.code} {opponent.name} / Pool: {selectedPool.length} countries
              </p>
            </div>
            <input
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              className="w-full md:w-80 border border-border bg-background px-4 py-3 font-mono text-[10px] uppercase tracking-widest"
              placeholder="Search country"
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCountries.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleCountry(item)}
                className={`text-left p-5 border transition-colors ${opponent.id === item.id ? "border-primary bg-primary/10" : selectedPool.includes(item.id) ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-foreground/50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl uppercase italic mb-1">{item.name} AI</h3>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{item.code}</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-4">{item.difficulty}</div>
                <p className="text-xs mb-4">{item.desc}</p>
                <div className="font-mono text-[10px] uppercase tracking-widest text-success">{item.reward}</div>
              </button>
            ))}
          </div>
          <button disabled={!selectedPool.length} onClick={() => setStep(2)} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-sm disabled:opacity-50">
            Continue With Agent Mode
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
              <div className="font-display text-2xl uppercase italic mb-6">{opponent.name} AI</div>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-2">Country Pool: {selectedPool.length}</div>
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

      {step === 4 && (
        <MatchSimulation
          result={result}
          homeCode="NGA"
          homeName="Nigeria"
          awayCode={opponent.code}
          awayName={opponent.name}
          agentNames={agentNames}
          fixtureContext={footballContext}
          onComplete={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <div className="space-y-10 text-center py-8">
          <div className="space-y-2">
            <h2 className={`font-display text-6xl uppercase italic ${result?.won ? "text-success" : "text-destructive"}`}>
              {result?.won ? "Victory" : "Full Time"}
            </h2>
            <div className="font-display text-4xl">
              Nigeria {result?.scoreUser ?? "-"} - {result?.scoreAgent ?? "-"} {opponent.name} AI
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
