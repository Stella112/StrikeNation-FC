"use client";

import { useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { arenaAbi, contracts, explorerTx } from "@/lib/contracts";

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
  10: "Iran",
  11: "Australia",
  12: "Indonesia",
  13: "India",
  14: "China",
};

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

function normalizeBattle(result) {
  if (!result) return null;
  return {
    player: result.player ?? result[0],
    agentId: result.agentId ?? result[1],
    country: result.country ?? result[2],
    opponentCountry: result.opponentCountry ?? result[3],
    strategyHash: result.strategyHash ?? result[4],
    power: result.power ?? result[5],
    settled: result.settled ?? result[6],
    won: result.won ?? result[7],
  };
}

function normalizeCourtMatch(result) {
  if (!result) return null;
  return {
    playerA: result.playerA ?? result[0],
    playerB: result.playerB ?? result[1],
    agentA: result.agentA ?? result[2],
    agentB: result.agentB ?? result[3],
    countryA: result.countryA ?? result[4],
    countryB: result.countryB ?? result[5],
    strategyA: result.strategyA ?? result[6],
    strategyB: result.strategyB ?? result[7],
    settled: result.settled ?? result[8],
    scoreA: result.scoreA ?? result[9],
    scoreB: result.scoreB ?? result[10],
    winner: result.winner ?? result[11],
  };
}

async function readRecentStateRows(publicClient, scope, lowerAddress, limit) {
  try {
    const [battleCount, courtMatchCount] = await Promise.all([
      withTimeout(
        publicClient.readContract({
          address: contracts.StrikeNationArena,
          abi: arenaAbi,
          functionName: "battleCount",
        }),
        7000,
      ),
      withTimeout(
        publicClient.readContract({
          address: contracts.StrikeNationArena,
          abi: arenaAbi,
          functionName: "courtMatchCount",
        }),
        7000,
      ),
    ]);

    const battleIds = [];
    for (let id = battleCount; id > 0n && battleIds.length < limit; id -= 1n) battleIds.push(id);
    const courtIds = [];
    for (let id = courtMatchCount; id > 0n && courtIds.length < limit; id -= 1n) courtIds.push(id);

    const [battles, courtMatches] = await Promise.all([
      Promise.allSettled(
        battleIds.map((id) =>
          withTimeout(
            publicClient.readContract({
              address: contracts.StrikeNationArena,
              abi: arenaAbi,
              functionName: "battles",
              args: [id],
            }),
            7000,
          ).then((result) => ({ id, result })),
        ),
      ),
      Promise.allSettled(
        courtIds.map((id) =>
          withTimeout(
            publicClient.readContract({
              address: contracts.StrikeNationArena,
              abi: arenaAbi,
              functionName: "courtMatches",
              args: [id],
            }),
            7000,
          ).then((result) => ({ id, result })),
        ),
      ),
    ]);

    const isWallet = (value) => value?.toLowerCase?.() === lowerAddress;
    const walletOnly = scope === "wallet";
    const quickRows = battles
      .filter((item) => item.status === "fulfilled")
      .map((item) => ({ ...item.value, result: normalizeBattle(item.value.result) }))
      .filter(({ result }) => result?.player && result.player !== zeroAddress && result.settled && (!walletOnly || isWallet(result.player)))
      .map(({ id, result }) => ({
        type: "Quick Battle",
        label: `${result.won ? "Won" : "Lost"} battle #${id.toString()}`,
        detail: `${shortAddress(result.player)}: ${countryNames[Number(result.country)] || `Country ${Number(result.country)}`} vs ${countryNames[Number(result.opponentCountry)] || `Country ${Number(result.opponentCountry)}`} / power ${Number(result.power)}`,
        blockNumber: 0n,
        transactionHash: "",
        age: "on-chain state",
        stateOnly: true,
      }));

    const courtRows = courtMatches
      .filter((item) => item.status === "fulfilled")
      .map((item) => ({ ...item.value, result: normalizeCourtMatch(item.value.result) }))
      .filter(({ result }) => result?.playerA && result.playerA !== zeroAddress && (!walletOnly || isWallet(result.playerA) || isWallet(result.playerB) || isWallet(result.winner)))
      .map(({ id, result }) => ({
        type: result.settled ? "PvP Result" : "PvP",
        label: result.settled ? `Match #${id.toString()} settled ${Number(result.scoreA)}-${Number(result.scoreB)}` : `Match #${id.toString()} waiting`,
        detail: `${shortAddress(result.playerA)} vs ${result.playerB === zeroAddress ? "waiting" : shortAddress(result.playerB)}${result.winner && result.winner !== zeroAddress ? ` / winner ${shortAddress(result.winner)}` : ""}`,
        blockNumber: 0n,
        transactionHash: "",
        age: "on-chain state",
        stateOnly: true,
      }));

    return [...quickRows, ...courtRows].slice(0, limit);
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
      const stateRows = await readRecentStateRows(publicClient, scope, lowerAddress, limit);
      if (stateRows.length) setRows(stateRows.slice(0, limit));

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
          ...stateRows,
        ]
          .filter((row, index, all) =>
            all.findIndex((item) =>
              row.transactionHash
                ? item.transactionHash === row.transactionHash && item.label === row.label
                : item.label === row.label && item.detail === row.detail,
            ) === index,
          )
          .slice(0, limit),
      );
    } catch (err) {
      const stateRows = await readRecentStateRows(publicClient, scope, lowerAddress, limit);
      if (stateRows.length) {
        setRows(stateRows.slice(0, limit));
        setError("Showing direct on-chain match state while X Layer event logs catch up.");
      } else {
        setError("X Layer event logs are still syncing. Try Refresh in a moment.");
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
      {error && <p className="border border-border bg-background p-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{error}</p>}
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
                {row.stateOnly && <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-accent">Read directly from contract state</p>}
              </div>
              <div className="text-left sm:text-right">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {row.age} {row.blockNumber ? `/ block ${row.blockNumber.toString()}` : ""}
                </div>
                {row.transactionHash ? (
                  <a href={explorerTx(row.transactionHash)} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-widest text-primary hover:underline">
                    Tx {shortHash(row.transactionHash)}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
