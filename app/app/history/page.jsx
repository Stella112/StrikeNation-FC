"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { arenaAbi, contracts, explorerTx } from "@/lib/contracts";

const agentMatchEvent = parseAbiItem(
  "event AgentMatchSettled(uint256 indexed battleId,address indexed player,uint8 indexed opponentCountry,bool won,uint8 scoreUser,uint8 scoreAgent,uint256 points)",
);

const courtSettledEvent = parseAbiItem(
  "event CourtMatchSettled(uint256 indexed matchId,address indexed winner,uint8 scoreA,uint8 scoreB,uint256 winnerPoints,uint256 loserPoints)",
);

const courtCreatedEvent = parseAbiItem(
  "event CourtMatchCreated(uint256 indexed matchId,address indexed playerA,uint256 indexed agentA,uint8 countryA,bytes32 strategyA)",
);

const courtJoinedEvent = parseAbiItem(
  "event CourtMatchJoined(uint256 indexed matchId,address indexed playerB,uint256 indexed agentB,uint8 countryB,bytes32 strategyB)",
);

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
  13: "India",
  14: "China",
};

function shortHash(hash) {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function formatAge(timestamp) {
  if (!timestamp) return "recent";
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - Number(timestamp)));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lowerAddress = useMemo(() => address?.toLowerCase(), [address]);

  async function loadHistory() {
    setError("");
    if (!publicClient || !address) return;

    setLoading(true);
    try {
      const latest = await publicClient.getBlockNumber();
      const fromBlock = latest > 500000n ? latest - 500000n : 0n;

      const [agentLogs, pvpWinLogs, createdLogs, joinedLogs] = await Promise.all([
        publicClient.getLogs({
          address: contracts.StrikeNationArena,
          event: agentMatchEvent,
          args: { player: address },
          fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: contracts.StrikeNationArena,
          event: courtSettledEvent,
          args: { winner: address },
          fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: contracts.StrikeNationArena,
          event: courtCreatedEvent,
          args: { playerA: address },
          fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: contracts.StrikeNationArena,
          event: courtJoinedEvent,
          args: { playerB: address },
          fromBlock,
          toBlock: "latest",
        }),
      ]);

      const pvpSideByMatch = new Map();
      for (const log of createdLogs) pvpSideByMatch.set(log.args.matchId.toString(), "A");
      for (const log of joinedLogs) pvpSideByMatch.set(log.args.matchId.toString(), "B");

      const pvpParticipantRows = await Promise.all(
        [...pvpSideByMatch.entries()].map(async ([matchId, side]) => {
          const courtMatch = await publicClient.readContract({
            address: contracts.StrikeNationArena,
            abi: arenaAbi,
            functionName: "courtMatches",
            args: [BigInt(matchId)],
          });

          const settled = courtMatch.settled ?? courtMatch[8];
          if (!settled) return null;

          const scoreA = Number(courtMatch.scoreA ?? courtMatch[9]);
          const scoreB = Number(courtMatch.scoreB ?? courtMatch[10]);
          const winner = (courtMatch.winner ?? courtMatch[11])?.toLowerCase();
          const won = winner === lowerAddress;
          const userScore = side === "A" ? scoreA : scoreB;
          const opponentScore = side === "A" ? scoreB : scoreA;
          const settleLog = pvpWinLogs.find((log) => log.args.matchId.toString() === matchId);

          return {
            id: `PVP-${matchId}`,
            blockNumber: settleLog?.blockNumber || latest,
            transactionHash: settleLog?.transactionHash || createdLogs.find((log) => log.args.matchId.toString() === matchId)?.transactionHash,
            opponent: "Wallet PvP",
            result: won ? `Won ${userScore}-${opponentScore}` : `Lost ${userScore}-${opponentScore}`,
            points: won ? "+180 PTS" : "+70 PTS",
            summary: "PvP court match read from courtMatches and settlement state on StrikeNationArena.",
          };
        }),
      );

      const rows = [
        ...agentLogs.map((log) => ({
          id: `Q-${log.args.battleId.toString()}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          opponent: `${countryNames[Number(log.args.opponentCountry)] || "AI"} Agent`,
          result: log.args.won ? `Won ${Number(log.args.scoreUser)}-${Number(log.args.scoreAgent)}` : `Lost ${Number(log.args.scoreUser)}-${Number(log.args.scoreAgent)}`,
          points: `+${log.args.points.toString()} PTS`,
          summary: "Quick Battle settled by AgentMatchSettled on StrikeNationArena.",
        })),
        ...pvpWinLogs
          .filter((log) => !pvpSideByMatch.has(log.args.matchId.toString()))
          .map((log) => ({
          id: `PVP-${log.args.matchId.toString()}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          opponent: "Wallet PvP",
          result: `Won ${Number(log.args.scoreA)}-${Number(log.args.scoreB)}`,
          points: `+${log.args.winnerPoints.toString()} PTS`,
          summary: "PvP court match win settled on StrikeNationArena.",
        })),
        ...pvpParticipantRows.filter(Boolean),
      ].sort((a, b) => Number(b.blockNumber - a.blockNumber));

      const uniqueBlocks = [...new Set(rows.slice(0, 12).map((row) => row.blockNumber.toString()))];
      const blockMap = new Map();
      await Promise.all(
        uniqueBlocks.map(async (blockNumber) => {
          const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
          blockMap.set(blockNumber, block.timestamp);
        }),
      );

      setHistory(
        rows.slice(0, 12).map((row) => ({
          ...row,
          date: formatAge(blockMap.get(row.blockNumber.toString())),
        })),
      );
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Could not load X Layer battle history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowerAddress, publicClient]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase italic mb-2">Battle History</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Real match events from StrikeNationArena on X Layer
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadHistory} className="border border-border bg-background px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-muted">
            Refresh
          </button>
          <Link href="/app/battle/quick" className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:opacity-90">
            New Battle
          </Link>
        </div>
      </div>

      {!isConnected && (
        <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
          Connect OKX Wallet to load your on-chain battle history.
        </div>
      )}

      {error && <div className="border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</div>}

      {loading && (
        <div className="border border-border bg-card p-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Reading recent X Layer logs...
        </div>
      )}

      {!loading && isConnected && history.length === 0 && (
        <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
          No settled matches found for this wallet in the recent X Layer log window. Play Quick Battle or settle a PvP match to populate history.
        </div>
      )}

      <div className="space-y-4">
        {history.map((match) => (
          <div key={`${match.id}-${match.transactionHash}`} className="border border-border bg-card p-5">
            <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-4 mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-4">
                <span className={`font-display text-2xl ${match.result.startsWith("Won") ? "text-success" : "text-destructive"}`}>
                  {match.result}
                </span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">vs {match.opponent}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest mt-1">{match.date} / block {match.blockNumber.toString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl text-success">{match.points}</div>
                <a href={explorerTx(match.transactionHash)} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-widest text-primary hover:underline mt-1 block">
                  Tx: {shortHash(match.transactionHash)}
                </a>
              </div>
            </div>

            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">On-Chain Source</div>
              <p className="text-sm italic">"{match.summary}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
