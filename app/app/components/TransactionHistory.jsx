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

export function TransactionHistory({ limit = 8, title = "Transaction History", compact = false }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lowerAddress = useMemo(() => address?.toLowerCase(), [address]);

  async function loadTransactions() {
    setError("");
    if (!publicClient || !address) return;

    setLoading(true);
    try {
      const latest = await publicClient.getBlockNumber();
      const fromBlock = latest > 500000n ? latest - 500000n : 0n;

      const [
        passportMints,
        squadMints,
        agentBattles,
        pvpCreated,
        pvpJoined,
        pvpSettledWins,
        marketIntents,
        liveMarkets,
        liveStakes,
      ] = await Promise.all([
        publicClient.getLogs({ address: contracts.FanPassportNFT, event: transferEvent, args: { to: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeAgentNFT, event: squadEvent, args: { owner: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: agentBattleEvent, args: { player: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: pvpCreatedEvent, args: { playerA: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: pvpJoinedEvent, args: { playerB: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: pvpSettledEvent, args: { winner: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: marketIntentEvent, args: { proposer: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: liveMarketEvent, args: { creator: address }, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: contracts.StrikeNationArena, event: liveStakeEvent, args: { player: address }, fromBlock, toBlock: "latest" }),
      ]);

      const activity = [
        ...passportMints.map((log) => ({
          type: "Fan Passport",
          label: `Minted passport #${log.args.tokenId.toString()}`,
          detail: "FanPassportNFT Transfer to your wallet",
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...squadMints.map((log) => ({
          type: "Strike Squad",
          label: `Minted 11 agents #${log.args.firstAgentId.toString()}-${log.args.lastAgentId.toString()}`,
          detail: "StrikeAgentNFT squad mint",
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...agentBattles.map((log) => ({
          type: "Quick Battle",
          label: `${log.args.won ? "Won" : "Lost"} ${Number(log.args.scoreUser)}-${Number(log.args.scoreAgent)}`,
          detail: `AgentMatchSettled, +${log.args.points.toString()} points`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...pvpCreated.map((log) => ({
          type: "PvP",
          label: `Created match #${log.args.matchId.toString()}`,
          detail: "CourtMatchCreated",
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...pvpJoined.map((log) => ({
          type: "PvP",
          label: `Joined match #${log.args.matchId.toString()}`,
          detail: "CourtMatchJoined",
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...pvpSettledWins.map((log) => ({
          type: "PvP Result",
          label: `Won match #${log.args.matchId.toString()} ${Number(log.args.scoreA)}-${Number(log.args.scoreB)}`,
          detail: `CourtMatchSettled, +${log.args.winnerPoints.toString()} points`,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...marketIntents.map((log) => ({
          type: "Market Intent",
          label: `Posted intent #${log.args.intentId.toString()}`,
          detail: log.args.question,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...liveMarkets.map((log) => ({
          type: "Live Market",
          label: `Posted ${log.args.homeTeam} vs ${log.args.awayTeam}`,
          detail: log.args.question,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...liveStakes.map((log) => ({
          type: "Live Stake",
          label: `Staked on market #${log.args.marketId.toString()}`,
          detail: `Pick ${Number(log.args.pick)} / amount ${log.args.amount.toString()} USDT0 units`,
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
        activity.slice(0, limit).map((row) => ({
          ...row,
          age: formatAge(blockMap.get(row.blockNumber.toString())),
        })),
      );
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Could not load wallet transaction history.");
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
            Real wallet activity from X Layer contracts
          </p>
        </div>
        <button onClick={loadTransactions} className="border border-border bg-background px-3 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-muted">
          Refresh
        </button>
      </div>

      {!isConnected && <p className="text-sm text-muted-foreground">Connect OKX Wallet to load your profile transactions.</p>}
      {error && <p className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {loading && <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Reading X Layer logs...</p>}
      {!loading && isConnected && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No recent StrikeNation transactions found for this wallet yet.</p>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={`${row.transactionHash}-${row.label}`} className="border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-primary">{row.type}</div>
                <strong className="block text-sm mt-1">{row.label}</strong>
                <p className="text-xs text-muted-foreground mt-1">{row.detail}</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {row.age} / block {row.blockNumber.toString()}
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
