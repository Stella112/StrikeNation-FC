"use client";

import { useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { contracts, explorerTx } from "@/lib/contracts";

const transferEvent = parseAbiItem("event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)");
const squadEvent = parseAbiItem("event StrikeSquadMinted(address indexed owner,uint8 indexed country,uint256 firstAgentId,uint256 lastAgentId)");
const agentBattleEvent = parseAbiItem(
  "event AgentMatchSettled(uint256 indexed battleId,address indexed player,uint8 indexed opponentCountry,bool won,uint8 scoreUser,uint8 scoreAgent,uint256 points)",
);
const pvpCreatedEvent = parseAbiItem(
  "event CourtMatchCreated(uint256 indexed matchId,address indexed playerA,uint256 indexed agentA,uint8 countryA,bytes32 strategyA)",
);
const pvpJoinedEvent = parseAbiItem(
  "event CourtMatchJoined(uint256 indexed matchId,address indexed playerB,uint256 indexed agentB,uint8 countryB,bytes32 strategyB)",
);
const pvpSettledEvent = parseAbiItem(
  "event CourtMatchSettled(uint256 indexed matchId,address indexed winner,uint8 scoreA,uint8 scoreB,uint256 winnerPoints,uint256 loserPoints)",
);
const marketIntentEvent = parseAbiItem(
  "event ExchangeOSMarketIntent(uint256 indexed intentId,address indexed proposer,uint256 indexed courtMatchId,uint8 countryA,uint8 countryB,string question,bytes32 agentStrategyHash)",
);
const liveMarketEvent = parseAbiItem(
  "event LiveMatchMarketPosted(uint256 indexed marketId,address indexed creator,string fixtureId,string homeTeam,string awayTeam,string question,uint64 kickoff,bytes32 agentIntentHash)",
);
const liveStakeEvent = parseAbiItem(
  "event LiveMatchStakePlaced(uint256 indexed marketId,address indexed player,uint8 indexed pick,uint256 amount,uint256 totalStaked)",
);
const zeroAddress = "0x0000000000000000000000000000000000000000";
const localHistoryKey = "strikenation:recent-history";

function shortHash(hash) {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function shortAddress(address) {
  if (!address) return "unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("RPC request timed out")), ms);
    }),
  ]);
}

function readLocalHistory(scope, lowerAddress) {
  if (typeof window === "undefined") return [];
  try {
    const cached = JSON.parse(window.localStorage.getItem(localHistoryKey) || "[]");
    return cached
      .filter((row) => scope === "global" || row.wallet?.toLowerCase?.() === lowerAddress)
      .map((row) => ({
        type: row.type || "Recent Battle",
        label: row.label || "Battle transaction submitted",
        detail: row.detail || "Waiting for X Layer event indexing",
        transactionHash: row.transactionHash,
        blockNumber: BigInt(row.blockNumber || 0),
        age: "just now",
        localOnly: true,
      }));
  } catch {
    return [];
  }
}

export function TransactionHistory({ limit = 8, title = "Transaction History", compact = false, scope = "wallet" }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lowerAddress = useMemo(() => address?.toLowerCase(), [address]);

  async function loadTransactions() {
    setError("");
    if (!publicClient || (scope === "wallet" && !address)) return;

    setLoading(true);
    try {
      const localRows = readLocalHistory(scope, lowerAddress);
      if (localRows.length) setRows(localRows.slice(0, limit));

      const latest = await publicClient.getBlockNumber();
      const fromBlock = latest > 250000n ? latest - 250000n : 0n;
      const safeLogs = async (params) => {
        const chunk = 10000n;
        const chunks = [];
        for (let start = fromBlock; start <= latest; start += chunk + 1n) {
          const end = start + chunk > latest ? latest : start + chunk;
          chunks.push([start, end]);
        }
        const settled = await Promise.allSettled(
          chunks
            .reverse()
            .map(([start, end]) => withTimeout(publicClient.getLogs({ ...params, fromBlock: start, toBlock: end }), 7000)),
        );
        return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      };

      const [
        passportLogs,
        squadLogs,
        agentBattleLogs,
        pvpCreatedLogs,
        pvpJoinedLogs,
        pvpSettledLogs,
        marketIntentLogs,
        liveMarketLogs,
        liveStakeLogs,
      ] = await Promise.all([
        safeLogs({ address: contracts.FanPassportNFT, event: transferEvent }),
        safeLogs({ address: contracts.StrikeAgentNFT, event: squadEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: agentBattleEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: pvpCreatedEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: pvpJoinedEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: pvpSettledEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: marketIntentEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: liveMarketEvent }),
        safeLogs({ address: contracts.StrikeNationArena, event: liveStakeEvent }),
      ]);

      const isWallet = (value) => value?.toLowerCase?.() === lowerAddress;
      const walletOnly = scope === "wallet";
      const passportMints = passportLogs.filter((log) => log.args.from?.toLowerCase?.() === zeroAddress && (!walletOnly || isWallet(log.args.to)));
      const squadMints = squadLogs.filter((log) => !walletOnly || isWallet(log.args.owner));
      const agentBattles = agentBattleLogs.filter((log) => !walletOnly || isWallet(log.args.player));
      const pvpCreated = pvpCreatedLogs.filter((log) => !walletOnly || isWallet(log.args.playerA));
      const pvpJoined = pvpJoinedLogs.filter((log) => !walletOnly || isWallet(log.args.playerB));
      const pvpSettledWins = pvpSettledLogs.filter((log) => !walletOnly || isWallet(log.args.winner));
      const marketIntents = marketIntentLogs.filter((log) => !walletOnly || isWallet(log.args.proposer));
      const liveMarkets = liveMarketLogs.filter((log) => !walletOnly || isWallet(log.args.creator));
      const liveStakes = liveStakeLogs.filter((log) => !walletOnly || isWallet(log.args.player));

      const activity = [
        ...passportMints.map((log) => ({
          type: "Fan Passport",
          label: `Minted passport #${log.args.tokenId.toString()}`,
          detail: `FanPassportNFT mint to ${shortAddress(log.args.to)}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...squadMints.map((log) => ({
          type: "Strike Squad",
          label: `Minted 11 agents #${log.args.firstAgentId.toString()}-${log.args.lastAgentId.toString()}`,
          detail: `StrikeAgentNFT squad mint by ${shortAddress(log.args.owner)}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...agentBattles.map((log) => ({
          type: "Quick Battle",
          label: `${log.args.won ? "Won" : "Lost"} ${Number(log.args.scoreUser)}-${Number(log.args.scoreAgent)}`,
          detail: `AgentMatchSettled by ${shortAddress(log.args.player)}, +${log.args.points.toString()} points`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...pvpCreated.map((log) => ({
          type: "PvP",
          label: `Created match #${log.args.matchId.toString()}`,
          detail: `CourtMatchCreated by ${shortAddress(log.args.playerA)}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...pvpJoined.map((log) => ({
          type: "PvP",
          label: `Joined match #${log.args.matchId.toString()}`,
          detail: `CourtMatchJoined by ${shortAddress(log.args.playerB)}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...pvpSettledWins.map((log) => ({
          type: "PvP Result",
          label: `Won match #${log.args.matchId.toString()} ${Number(log.args.scoreA)}-${Number(log.args.scoreB)}`,
          detail: `CourtMatchSettled winner ${shortAddress(log.args.winner)}, +${log.args.winnerPoints.toString()} points`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...marketIntents.map((log) => ({
          type: "Market Intent",
          label: `Posted intent #${log.args.intentId.toString()}`,
          detail: `${shortAddress(log.args.proposer)}: ${log.args.question}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...liveMarkets.map((log) => ({
          type: "Live Market",
          label: `Posted ${log.args.homeTeam} vs ${log.args.awayTeam}`,
          detail: `${shortAddress(log.args.creator)}: ${log.args.question}`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...liveStakes.map((log) => ({
          type: "Live Stake",
          label: `Staked on market #${log.args.marketId.toString()}`,
          detail: `${shortAddress(log.args.player)} pick ${Number(log.args.pick)} / amount ${log.args.amount.toString()} USDT0 units`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
      ]
        .filter((row) => row.transactionHash)
        .filter((row, index, all) => all.findIndex((item) => item.transactionHash === row.transactionHash && item.label === row.label) === index)
        .sort((a, b) => Number(b.blockNumber - a.blockNumber));

      const blockNumbers = [...new Set(activity.slice(0, limit).map((row) => row.blockNumber.toString()))];
      const blockMap = new Map();
      await Promise.all(
        blockNumbers.map(async (blockNumber) => {
          const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
          blockMap.set(blockNumber, block.timestamp);
        }),
      );

      setRows(
        [
          ...activity.slice(0, limit).map((row) => ({
            ...row,
            age: formatAge(blockMap.get(row.blockNumber.toString())),
          })),
          ...localRows,
        ]
          .filter((row) => row.transactionHash)
          .filter((row, index, all) => all.findIndex((item) => item.transactionHash === row.transactionHash && item.label === row.label) === index)
          .slice(0, limit),
      );
    } catch (err) {
      const localRows = readLocalHistory(scope, lowerAddress);
      if (localRows.length) {
        setRows(localRows.slice(0, limit));
        setError("Showing recent local activity while X Layer log indexing catches up.");
      } else {
        setError(err?.shortMessage || err?.message || "Could not load wallet transaction history.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowerAddress, publicClient, limit]);

  return (
    <section className={`border border-border bg-card ${compact ? "p-5" : "p-6"} rounded-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-2xl uppercase italic">{title}</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {scope === "global" ? "Total arena activity from X Layer contracts" : "Real wallet activity from X Layer contracts"}
          </p>
        </div>
        <button onClick={loadTransactions} className="border border-border bg-background px-3 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-muted">
          Refresh
        </button>
      </div>

      {!isConnected && scope === "wallet" && <p className="text-sm text-muted-foreground">Connect OKX Wallet to load your profile transactions.</p>}
      {error && <p className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {loading && <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Reading X Layer logs...</p>}
      {!loading && (scope === "global" || isConnected) && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {scope === "global" ? "No recent arena events found in the indexed X Layer window yet." : "No recent StrikeNation transactions found for this wallet yet."}
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={`${row.transactionHash}-${row.label}`} className="border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-primary">{row.type}</div>
                <strong className="block text-sm mt-1">{row.label}</strong>
                <p className="text-xs text-muted-foreground mt-1">{row.detail}</p>
                {row.localOnly && <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-accent">Local receipt fallback / waiting for RPC logs</p>}
              </div>
              <div className="text-left sm:text-right">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {row.age} {row.blockNumber ? `/ block ${row.blockNumber.toString()}` : ""}
                </div>
                <a href={explorerTx(row.transactionHash)} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-widest text-primary hover:underline">
                  Tx {shortHash(row.transactionHash)}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
