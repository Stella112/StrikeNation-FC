"use client";

import Link from "next/link";
import { useState } from "react";

export default function PvPBattlePage() {
  const [mode, setMode] = useState("select"); // select, create, join, waiting

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Challenge Player</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Wallet vs Wallet PvP • On-chain settlement
          </p>
        </div>
        {mode !== "select" && (
          <button onClick={() => setMode("select")} className="font-mono text-[10px] uppercase tracking-widest underline">
            ← Back
          </button>
        )}
      </div>

      {mode === "select" && (
        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => setMode("create")}
            className="border border-border bg-card p-8 text-left hover:border-primary transition-colors group"
          >
            <h2 className="font-display text-3xl uppercase italic mb-2 group-hover:text-primary transition-colors">Create Challenge</h2>
            <p className="text-sm text-muted-foreground">Host a match room, set the stakes, and invite another wallet to battle your 11-agent squad.</p>
          </button>
          <button 
            onClick={() => setMode("join")}
            className="border border-border bg-card p-8 text-left hover:border-secondary transition-colors group"
          >
            <h2 className="font-display text-3xl uppercase italic mb-2 group-hover:text-secondary transition-colors">Join Challenge</h2>
            <p className="text-sm text-muted-foreground">Enter an invite code or browse open lobbies to challenge a waiting opponent.</p>
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="max-w-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Match Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Select Squad</label>
              <select className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option>Nigeria FanDAO Squad (Current)</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Stake / Points Level</label>
              <select className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option>Friendly (0 Points)</option>
                <option>Ranked (100 Points)</option>
                <option>High Roller (500 Points)</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Match Type</label>
              <select className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option>Private (Invite Only)</option>
                <option>Public (Open Lobby)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => setMode("waiting")}
            className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90"
          >
            Create Match Room
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="max-w-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-display text-2xl uppercase italic">Enter Invite Code</h2>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Match Code</label>
            <input type="text" className="w-full bg-background border border-border px-3 py-3 text-lg font-mono uppercase focus:outline-none focus:border-secondary" placeholder="e.g. NGA-BRZ-482" />
          </div>
          <button 
            className="w-full bg-secondary text-secondary-foreground font-mono text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:opacity-90"
          >
            Join Match
          </button>

          <div className="pt-6 border-t border-border mt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Open Lobbies</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between border border-border bg-background p-3">
                <div className="font-mono text-[10px] uppercase tracking-widest">Argentina • 100 PTS</div>
                <button className="text-[9px] uppercase tracking-widest bg-muted px-2 py-1 hover:bg-secondary hover:text-secondary-foreground">Join</button>
              </div>
              <div className="flex items-center justify-between border border-border bg-background p-3">
                <div className="font-mono text-[10px] uppercase tracking-widest">England • 500 PTS</div>
                <button className="text-[9px] uppercase tracking-widest bg-muted px-2 py-1 hover:bg-secondary hover:text-secondary-foreground">Join</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "waiting" && (
        <div className="max-w-xl text-center border border-border bg-card p-10 space-y-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary animate-pulse">● Live on X Layer</div>
          <h2 className="font-display text-3xl uppercase italic">Waiting for opponent...</h2>
          
          <div className="bg-background border border-border p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Invite Code</div>
            <div className="font-display text-4xl tracking-wider">NGA-841</div>
          </div>
          
          <p className="text-sm text-muted-foreground">Share this code with another wallet to start the battle.</p>
          
          <button className="border border-border font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-sm hover:bg-muted">
            Copy Invite Link
          </button>
        </div>
      )}

    </div>
  );
}
