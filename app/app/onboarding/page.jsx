"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { agentAbi, contracts, explorerTx, passportAbi } from "@/lib/contracts";

const countries = [
  { name: "Nigeria", id: 1, flag: "NG", identity: "Underdog speed", score: 1240 },
  { name: "Brazil", id: 2, flag: "BR", identity: "Creative pressure", score: 1390 },
  { name: "Argentina", id: 3, flag: "AR", identity: "Calm finishers", score: 1315 },
  { name: "England", id: 4, flag: "EN", identity: "Set-piece machine", score: 1188 },
  { name: "Underdog", id: 5, flag: "UD", identity: "Chaos market", score: 1112 },
  { name: "Japan", id: 6, flag: "JP", identity: "Technical tempo", score: 1264 },
  { name: "South Korea", id: 7, flag: "KR", identity: "High press engine", score: 1237 },
  { name: "Saudi Arabia", id: 8, flag: "SA", identity: "Counter strike", score: 1168 },
  { name: "Qatar", id: 9, flag: "QA", identity: "Host nation nerve", score: 1086 },
  { name: "India", id: 13, flag: "IN", identity: "Rising crowd", score: 1024 },
  { name: "China", id: 14, flag: "CN", identity: "Pressure build", score: 1017 },
];

export default function OnboardingPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(1);
  const [hash, setHash] = useState();
  const [txLabel, setTxLabel] = useState("");
  const [error, setError] = useState("");

  const { data: passportId, refetch: refetchPassport } = useReadContract({
    address: contracts.FanPassportNFT,
    abi: passportAbi,
    functionName: "passportOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: hasSquad, refetch: refetchSquad } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "hasMintedSquad",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const hasPassport = Boolean(passportId && passportId > 0n);
  const selected = useMemo(() => countries.find((country) => country.id === selectedCountry), [selectedCountry]);

  useEffect(() => {
    if (hasPassport && step < 4) setStep(4);
    if (hasSquad && step < 5) setStep(5);
  }, [hasPassport, hasSquad, step]);

  useEffect(() => {
    if (!isSuccess) return;
    refetchPassport();
    refetchSquad();
    if (txLabel === "passport") setStep(4);
    if (txLabel === "squad") setStep(5);
  }, [isSuccess, refetchPassport, refetchSquad, txLabel]);

  async function submitTx(label, request) {
    setError("");
    if (!isConnected) {
      setError("Connect OKX Wallet from the top bar first.");
      return;
    }

    try {
      setTxLabel(label);
      const txHash = await writeContractAsync(request);
      setHash(txHash);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Transaction rejected.");
    }
  }

  function mintPassport() {
    submitTx("passport", {
      address: contracts.FanPassportNFT,
      abi: passportAbi,
      functionName: "mintPassport",
      args: [selectedCountry],
    });
  }

  function mintSquad() {
    const promptHash = keccak256(stringToHex(`StrikeNation:${selected?.name || "Nigeria"}:4-3-3:Sonnet`));
    submitTx("squad", {
      address: contracts.StrikeAgentNFT,
      abi: agentAbi,
      functionName: "createSquad",
      args: [`${selected?.name || "Nigeria"} Strike Squad`, selectedCountry, "4-3-3 AI Captain", promptHash],
    });
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="font-display text-4xl uppercase italic mb-2">Arena Setup</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Profile, FanDAO passport, and 11-player squad are wallet-owned on X Layer.
        </p>
      </div>

      {(error || hash) && (
        <div className="mb-6 border border-border bg-card p-4 font-mono text-[10px] uppercase tracking-widest">
          {error && <p className="text-destructive">{error}</p>}
          {hash && (
            <a className="text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              View transaction on OKX Explorer
            </a>
          )}
          {isConfirming && <p className="mt-2 text-muted-foreground">Waiting for X Layer confirmation...</p>}
        </div>
      )}

      <div className="space-y-8">
        <div className="border border-border p-6 rounded-sm bg-card">
          <h2 className="font-display text-2xl uppercase italic mb-4">1. Create Player Profile</h2>
          {step === 1 ? (
            <div className="space-y-4">
              <input className="w-full bg-background border border-border px-3 py-2 text-sm" placeholder="Display name" />
              <input className="w-full bg-background border border-border px-3 py-2 text-sm" placeholder="X handle" />
              <button onClick={() => setStep(2)} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm">
                Save Profile Locally
              </button>
            </div>
          ) : (
            <div className="font-mono text-xs text-success">Profile ready</div>
          )}
        </div>

        <div className={`border border-border p-6 rounded-sm bg-card ${step < 2 ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">2. Choose Country FanDAO</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country.id)}
                className={`border p-3 text-left transition-colors ${selectedCountry === country.id ? "border-primary bg-primary/10" : "border-border hover:border-foreground/50 bg-background"}`}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">{country.flag}</div>
                <div className="font-bold text-sm">{country.name}</div>
                <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-widest">{country.score} pts</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm">
            Use {selected?.name} FanDAO
          </button>
        </div>

        <div className={`border border-border p-6 rounded-sm bg-card ${step < 3 ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">3. Mint Fan Passport</h2>
          <p className="text-sm text-muted-foreground mb-6">
            One passport per wallet. If you already minted, the app reads it and moves you forward automatically.
          </p>
          {hasPassport ? (
            <div className="font-mono text-xs text-success">Passport #{passportId?.toString()} verified on X Layer</div>
          ) : (
            <button disabled={isPending || isConfirming} onClick={mintPassport} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm disabled:opacity-50">
              {isPending || (isConfirming && txLabel === "passport") ? "Minting..." : "Mint Fan Passport"}
            </button>
          )}
        </div>

        <div className={`border border-border p-6 rounded-sm bg-card ${step < 4 ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="font-display text-2xl uppercase italic mb-4">4. Mint Strike Agent Squad</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This mints your 11-player AI squad NFT set using the deployed StrikeAgentNFT contract.
          </p>
          {hasSquad ? (
            <div className="font-mono text-xs text-success">11-player squad verified on X Layer</div>
          ) : (
            <button disabled={isPending || isConfirming || !hasPassport} onClick={mintSquad} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm disabled:opacity-50">
              {isPending || (isConfirming && txLabel === "squad") ? "Minting Squad..." : "Mint 11-Player Squad"}
            </button>
          )}
        </div>

        {step > 4 && (
          <div className="pt-6 border-t border-border flex justify-center">
            <Link href="/app/battle/quick" className="bg-success text-success-foreground font-mono text-sm uppercase tracking-widest font-bold px-8 py-4 rounded-sm">
              Enter Battle Arena
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
