"use client";

import Link from "next/link";
import { useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { agentAbi, contracts, explorerTx } from "@/lib/contracts";

const players = [
  { id: 1, name: "Wall Keeper", role: "GK", rating: 87, type: "Reactive Sweeper", pos: { left: "50%", top: "85%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=gk" },
  { id: 3, name: "Iron", role: "LB", rating: 87, type: "Defensive Anchor", pos: { left: "20%", top: "70%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=iron" },
  { id: 4, name: "Stone", role: "CB", rating: 90, type: "Ball-playing", pos: { left: "40%", top: "73%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=stone" },
  { id: 5, name: "Command", role: "CB", rating: 92, type: "Sweeper Captain", pos: { left: "60%", top: "73%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=command" },
  { id: 2, name: "Green Eagle", role: "RB", rating: 91, type: "Overlapping Runner", pos: { left: "80%", top: "70%" }, img: "https://strike-nation-arena.lovable.app/assets/player-goat-3-l3t2Fdn4.png" },
  { id: 6, name: "Pivot", role: "CM", rating: 89, type: "Anchor", pos: { left: "30%", top: "50%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=pivot" },
  { id: 8, name: "Metronome", role: "CM", rating: 91, type: "Deep-lying Playmaker", pos: { left: "50%", top: "55%" }, img: "https://strike-nation-arena.lovable.app/assets/player-goat-1-DJk826KT.png" },
  { id: 10, name: "El Mago", role: "CAM", rating: 95, type: "Creative Playmaker", pos: { left: "70%", top: "50%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=elmago" },
  { id: 11, name: "Burner", role: "LW", rating: 92, type: "Inverted Winger", pos: { left: "25%", top: "30%" }, img: "https://strike-nation-arena.lovable.app/assets/player-goat-3-l3t2Fdn4.png" },
  { id: 9, name: "Eagle", role: "ST", rating: 96, type: "Poacher / Target", pos: { left: "50%", top: "20%" }, img: "https://strike-nation-arena.lovable.app/assets/player-goat-2-B6LvhrNS.png" },
  { id: 7, name: "Siete", role: "RW", rating: 94, type: "Dribbler / Driver", pos: { left: "75%", top: "30%" }, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=siete" },
];

function PitchAgentCard({ player }) {
  return (
    <div 
      className="absolute -translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer w-14 md:w-20 z-10"
      style={{ left: player.pos.left, top: player.pos.top }}
    >
      <div className="relative overflow-hidden rounded-md border-2 border-cyan-400 bg-background/90 shadow-[0_0_12px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform group-hover:z-20 group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(255,51,102,0.6)]">
        {/* Rating Badge */}
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[8px] md:text-[9px] px-1 font-bold rounded-bl-sm z-10">{player.rating}</div>
        {/* Country Badge */}
        <div className="absolute top-0 left-0 bg-background border-r border-b border-cyan-400 group-hover:border-primary text-[8px] px-0.5 rounded-br-sm z-10 transition-colors">🇳🇬</div>
        
        {/* Player Image */}
        <div className="h-14 md:h-16 w-full bg-muted/30 overflow-hidden relative flex items-center justify-center">
          <img src={player.img} alt={player.name} className="h-full w-full object-cover scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
        
        {/* Card Info */}
        <div className="absolute bottom-0 inset-x-0 pb-1 pt-4 bg-gradient-to-t from-background to-transparent">
          <div className="font-display text-[9px] md:text-[10px] uppercase leading-[1] truncate px-1 text-foreground drop-shadow-md">{player.name}</div>
          <div className="font-mono text-[7px] md:text-[8px] uppercase tracking-widest text-cyan-400 group-hover:text-primary transition-colors drop-shadow-md">{player.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function SquadPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [formation, setFormation] = useState("4-3-3 Attack");
  const [mentality, setMentality] = useState("Balanced");
  const [hash, setHash] = useState();
  const [error, setError] = useState("");
  const { data: hasSquad, refetch } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "hasMintedSquad",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function mintSquad() {
    setError("");
    if (!isConnected) {
      setError("Connect OKX Wallet first.");
      return;
    }

    try {
      const promptHash = keccak256(stringToHex(`squad:${address}:${formation}:${mentality}`));
      const txHash = await writeContractAsync({
        address: contracts.StrikeAgentNFT,
        abi: agentAbi,
        functionName: "createSquad",
        args: ["Nigeria Strike Squad", 1, `${formation} / ${mentality}`, promptHash],
      });
      setHash(txHash);
      refetch();
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Squad transaction rejected.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Squad Management</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Deploy your 11 Strike Agents on X Layer
          </p>
        </div>
        <button
          disabled={hasSquad || isPending || isConfirming}
          onClick={mintSquad}
          className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 rounded-sm hover:opacity-90 disabled:opacity-50"
        >
          {hasSquad ? "Squad Minted On X Layer" : isPending || isConfirming ? "Minting Squad..." : "Mint Squad On X Layer"}
        </button>
      </div>

      {(error || hash || isSuccess) && (
        <div className="border border-border bg-card p-4 font-mono text-[10px] uppercase tracking-widest">
          {error && <p className="text-destructive">{error}</p>}
          {hash && (
            <a className="text-primary underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              View squad transaction
            </a>
          )}
          {isSuccess && <p className="mt-2 text-success">Confirmed on X Layer.</p>}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Left: Pitch */}
        <div className="relative aspect-[4/3] bg-pitch/10 border border-pitch/30 rounded-sm overflow-hidden flex items-center justify-center">
          <div className="absolute inset-4 border-2 border-pitch/40 pointer-events-none"></div>
          <div className="absolute inset-x-4 top-1/2 h-px bg-pitch/40 pointer-events-none"></div>
          <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pitch/40 pointer-events-none md:size-28"></div>
          
          {/* Players mapping using PitchAgentCard */}
          {players.map((p) => (
            <PitchAgentCard key={p.id} player={p} />
          ))}
        </div>

        {/* Right: Tactics & Brain Weights */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-5 rounded-sm space-y-4">
            <h3 className="font-display text-xl uppercase italic">Team Tactics</h3>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Formation</label>
              <select 
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary"
              >
                <option>4-3-3 Attack</option>
                <option>4-2-3-1 Balanced</option>
                <option>3-5-2 High Press</option>
                <option>5-3-2 Counter</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Mentality</label>
              <select 
                value={mentality}
                onChange={(e) => setMentality(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary"
              >
                <option>Balanced</option>
                <option>Attacking</option>
                <option>Defensive</option>
                <option>Possession</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-sm">
            <h3 className="font-display text-xl uppercase italic mb-4">AI Brain Weights</h3>
            <p className="text-xs text-muted-foreground mb-4">Adjust how your agents make decisions on-chain.</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-mono text-[9px] uppercase mb-1">
                  <span>Risk Tolerance</span>
                  <span className="text-primary">75%</span>
                </div>
                <input type="range" className="w-full accent-primary" defaultValue={75} />
              </div>
              <div>
                <div className="flex justify-between font-mono text-[9px] uppercase mb-1">
                  <span>Passing Directness</span>
                  <span className="text-primary">60%</span>
                </div>
                <input type="range" className="w-full accent-primary" defaultValue={60} />
              </div>
              <div>
                <div className="flex justify-between font-mono text-[9px] uppercase mb-1">
                  <span>Pressing Intensity</span>
                  <span className="text-primary">90%</span>
                </div>
                <input type="range" className="w-full accent-primary" defaultValue={90} />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-card border border-border p-5 rounded-sm">
        <h3 className="font-display text-xl uppercase italic mb-4">Roster</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((p) => (
            <div key={p.id} className="border border-border p-3 flex justify-between items-center bg-background hover:border-primary transition-colors cursor-pointer">
              <div className="flex gap-3 items-center">
                <span className="size-8 bg-muted border border-border flex items-center justify-center font-mono text-xs font-bold">{p.id}</span>
                <div>
                  <div className="font-display uppercase text-sm">{p.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">{p.role} • {p.type}</div>
                </div>
              </div>
              <div className="font-display text-xl text-primary">{p.rating}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
