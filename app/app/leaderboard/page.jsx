"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { arenaAbi, contracts } from "@/lib/contracts";

const countries = [
  { id: 1, country: "Nigeria", flag: "NG" },
  { id: 2, country: "Brazil", flag: "BR" },
  { id: 3, country: "Argentina", flag: "AR" },
  { id: 4, country: "England", flag: "EN" },
  { id: 5, country: "Underdog", flag: "UD" },
  { id: 6, country: "Japan", flag: "JP" },
  { id: 7, country: "South Korea", flag: "KR" },
  { id: 8, country: "Saudi Arabia", flag: "SA" },
  { id: 9, country: "Qatar", flag: "QA" },
  { id: 13, country: "India", flag: "IN" },
  { id: 14, country: "China", flag: "CN" },
];

function formatPoints(value) {
  return Number(value || 0n).toLocaleString();
}

export default function LeaderboardPage() {
  const pointReads = countries.map((item) => ({
    address: contracts.StrikeNationArena,
    abi: arenaAbi,
    functionName: "countryPoints",
    args: [item.id],
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts: pointReads,
    query: { refetchInterval: 15000 },
  });

  const leaderboard = useMemo(
    () =>
      countries
        .map((item, index) => ({
          ...item,
          points: data?.[index]?.status === "success" ? data[index].result : 0n,
        }))
        .sort((a, b) => Number(b.points - a.points))
        .map((item, index) => ({ ...item, rank: index + 1 })),
    [data],
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Country Leaderboard</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="size-2 bg-success rounded-full"></span>
            {isLoading ? "Reading X Layer..." : "Live from StrikeNationArena countryPoints"}
          </p>
        </div>
        <button onClick={() => refetch()} className="border border-border bg-background px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-muted">
          Refresh On-Chain Data
        </button>
      </div>

      <div className="overflow-hidden border border-border">
        <div className="grid grid-cols-[40px_56px_1fr_140px] gap-4 border-b border-border bg-muted px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>#</span>
          <span>ID</span>
          <span>FanDAO</span>
          <span className="text-right">Points</span>
        </div>

        {leaderboard.map((item) => (
          <div
            key={item.id}
            className={`grid grid-cols-[40px_56px_1fr_140px] items-center gap-4 border-b border-border px-4 py-4 text-sm last:border-0 ${
              item.country === "Nigeria" ? "bg-primary/5" : "bg-card hover:bg-muted/50"
            }`}
          >
            <span className={`font-display text-xl ${item.rank <= 3 ? "text-primary" : ""}`}>
              {item.rank.toString().padStart(2, "0")}
            </span>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{item.flag}</div>
            <span className={`font-bold ${item.country === "Nigeria" ? "text-primary" : ""}`}>
              {item.country} FanDAO {item.country === "Nigeria" && "(You)"}
            </span>
            <span className="text-right font-display text-lg">{formatPoints(item.points)}</span>
          </div>
        ))}
      </div>

      {!isLoading && leaderboard.every((item) => item.points === 0n) && (
        <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
          No country points have been recorded yet. Mint a squad, run a quick battle, or post a market intent to move the table.
        </div>
      )}
    </div>
  );
}
