"use client";

import { useMemo, useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { agentAbi, arenaAbi, contracts, explorerTx } from "@/lib/contracts";

export default function PvPBattlePage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [mode, setMode] = useState("select");
  const [matchId, setMatchId] = useState("");
  const [hash, setHash] = useState();
  const [error, setError] = useState("");
  const { data: squad = [] } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "squadOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const agentId = useMemo(() => (squad?.length ? squad[0] : undefined), [squad]);

  async function submit(action) {
    setError("");
    if (!isConnected) {
      setError("Connect OKX Wallet first.");
      return;
    }
    if (!agentId && action !== "settle") {
      setError("Mint your 11-player squad before entering PvP.");
      return;
    }

    try {
      const strategyHash = keccak256(stringToHex(`${action}:${address}:${agentId?.toString() || "settle"}:${Date.now()}`));
      const request =
        action === "create"
          ? {
              address: contracts.StrikeNationArena,
              abi: arenaAbi,
              functionName: "createCourtMatch",
              args: [agentId, strategyHash],
            }
          : action === "join"
            ? {
                address: contracts.StrikeNationArena,
                abi: arenaAbi,
                functionName: "joinCourtMatch",
                args: [BigInt(matchId), agentId, strategyHash],
              }
            : {
                address: contracts.StrikeNationArena,
                abi: arenaAbi,
                functionName: "settleCourtMatch",
                args: [BigInt(matchId)],
              };

      const txHash = await writeContractAsync(request);
      setHash(txHash);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "PvP transaction rejected.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Challenge Player</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Real wallet-vs-wallet court matches on X Layer
          </p>
        </div>
        {mode !== "select" && (
          <button onClick={() => setMode("select")} className="font-mono text-[10px] uppercase tracking-widest underline">
            Back
          </button>
        )}
      </div>

      {(error || hash) && (
        <div className="border border-border bg-card p-4 font-mono text-[10px] uppercase tracking-widest">
          {error && <p className="text-destructive">{error}</p>}
          {hash && (
            <a className="text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              View PvP transaction
            </a>
          )}
          {isConfirming && <p className="mt-2 text-muted-foreground">Waiting for X Layer confirmation...</p>}
          {isSuccess && <p className="mt-2 text-success">Confirmed on X Layer.</p>}
        </div>
      )}

      {mode === "select" && (
        <div className="grid md:grid-cols-2 gap-6">
          <button onClick={() => setMode("create")} className="border border-border bg-card p-8 text-left hover:border-primary transition-colors group">
            <h2 className="font-display text-3xl uppercase italic mb-2 group-hover:text-primary">Create Challenge</h2>
            <p className="text-sm text-muted-foreground">Create an on-chain court match with your first squad agent.</p>
          </button>
          <button onClick={() => setMode("join")} className="border border-border bg-card p-8 text-left hover:border-secondary transition-colors group">
            <h2 className="font-display text-3xl uppercase italic mb-2 group-hover:text-secondary">Join / Settle</h2>
            <p className="text-sm text-muted-foreground">Join an existing match ID, then settle once both wallets have submitted.</p>
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="max-w-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Create On-Chain Match</h2>
          <p className="text-sm text-muted-foreground">Agent ID: {agentId ? agentId.toString() : "Mint squad first"}</p>
          <button disabled={isPending || isConfirming} onClick={() => submit("create")} className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm disabled:opacity-50">
            Create Court Match
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="max-w-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Join Or Settle Match</h2>
          <input value={matchId} onChange={(event) => setMatchId(event.target.value.replace(/\D/g, ""))} className="w-full bg-background border border-border px-3 py-3 text-lg font-mono uppercase" placeholder="Match ID" />
          <div className="grid grid-cols-2 gap-3">
            <button disabled={!matchId || isPending || isConfirming} onClick={() => submit("join")} className="bg-secondary text-secondary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm disabled:opacity-50">
              Join Match
            </button>
            <button disabled={!matchId || isPending || isConfirming} onClick={() => submit("settle")} className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm disabled:opacity-50">
              Settle Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
