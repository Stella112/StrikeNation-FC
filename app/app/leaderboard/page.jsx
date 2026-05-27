"use client";

import { useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { arenaAbi, contracts, explorerAddress } from "@/lib/contracts";

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
  { id: 10, country: "Iran", flag: "IR" },
  { id: 11, country: "Australia", flag: "AU" },
  { id: 12, country: "Indonesia", flag: "ID" },
  { id: 13, country: "India", flag: "IN" },
  { id: 14, country: "China", flag: "CN" },
];

const countryById = new Map(countries.map((country) => [country.id, country]));

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
const localHistoryKey = "strikenation:recent-history";

function formatPoints(value) {
  return Number(value || 0n).toLocaleString();
}

function shortAddress(address) {
  if (!address) return "unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function managerName(address) {
  if (!address) return "Manager";
  return `Manager_${address.slice(2, 6).toUpperCase()}`;
}

function emptyManager(address) {
  return {
    address,
    countryId: 0,
    points: 0n,
    wins: 0,
    matches: 0,
    passports: 0,
    lastBlock: 0n,
  };
}

function withTimeout(promise, ms = 6500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("RPC request timed out")), ms);
    }),
  ]);
}

function applyLocalManagers(managers) {
  if (typeof window === "undefined") return;
  try {
    const cached = JSON.parse(window.localStorage.getItem(localHistoryKey) || "[]");
    cached.forEach((entry) => {
      const wallet = entry.wallet;
      const key = wallet?.toLowerCase?.();
      if (!key) return;
      if (!managers.has(key)) managers.set(key, emptyManager(wallet));
      const row = managers.get(key);
      row.points += 1n;
      row.matches += 1;
      row.countryId ||= 1;
    });
  } catch {}
}

export default function LeaderboardPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [tab, setTab] = useState("countries");
  const [managerRows, setManagerRows] = useState([]);
  const [managerError, setManagerError] = useState("");
  const [managerLoading, setManagerLoading] = useState(false);
  const lowerAddress = address?.toLowerCase();

  const pointReads = countries.map((item) => ({
    address: contracts.StrikeNationArena,
    abi: arenaAbi,
    functionName: "countryPoints",
    args: [item.id],
  }));

  const { data, isLoading, refetch, dataUpdatedAt } = useReadContracts({
    contracts: pointReads,
    query: { refetchInterval: 5000 },
  });

  const countryRows = useMemo(
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

  async function loadManagers() {
    if (!publicClient) return;
    setManagerError("");
    setManagerLoading(true);

    try {
      const latest = await publicClient.getBlockNumber();
      const fromBlock = latest > 75000n ? latest - 75000n : 0n;
      const safeLogs = async (params) => {
        const chunk = 5000n;
        const chunks = [];
        for (let start = fromBlock; start <= latest; start += chunk + 1n) {
          const end = start + chunk > latest ? latest : start + chunk;
          chunks.push([start, end]);
        }
        const settled = await Promise.allSettled(
          chunks
            .slice(-8)
            .reverse()
            .map(([start, end]) => withTimeout(publicClient.getLogs({ ...params, fromBlock: start, toBlock: end }))),
        );
        return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      };

      const squadLogs = await safeLogs({ address: contracts.StrikeAgentNFT, event: squadEvent });
      const agentBattleLogs = await safeLogs({ address: contracts.StrikeNationArena, event: agentBattleEvent });
      const pvpCreatedLogs = await safeLogs({ address: contracts.StrikeNationArena, event: pvpCreatedEvent });
      const pvpJoinedLogs = await safeLogs({ address: contracts.StrikeNationArena, event: pvpJoinedEvent });
      const pvpSettledLogs = await safeLogs({ address: contracts.StrikeNationArena, event: pvpSettledEvent });
      const marketIntentLogs = await safeLogs({ address: contracts.StrikeNationArena, event: marketIntentEvent });
      const liveMarketLogs = await safeLogs({ address: contracts.StrikeNationArena, event: liveMarketEvent });
      const liveStakeLogs = await safeLogs({ address: contracts.StrikeNationArena, event: liveStakeEvent });

      const managers = new Map();
      const pvp = new Map();
      const getManager = (wallet) => {
        const key = wallet?.toLowerCase?.();
        if (!key) return null;
        if (!managers.has(key)) managers.set(key, emptyManager(wallet));
        return managers.get(key);
      };
      const touch = (row, blockNumber) => {
        if (row && blockNumber > row.lastBlock) row.lastBlock = blockNumber;
      };

      squadLogs.forEach((log) => {
        const row = getManager(log.args.owner);
        if (!row) return;
        row.countryId = Number(log.args.country);
        row.passports = 1;
        touch(row, log.blockNumber);
      });

      agentBattleLogs.forEach((log) => {
        const row = getManager(log.args.player);
        if (!row) return;
        row.points += log.args.points || 0n;
        row.matches += 1;
        if (log.args.won) row.wins += 1;
        touch(row, log.blockNumber);
      });

      pvpCreatedLogs.forEach((log) => {
        const matchId = log.args.matchId.toString();
        const row = getManager(log.args.playerA);
        if (row) {
          row.countryId ||= Number(log.args.countryA);
          touch(row, log.blockNumber);
        }
        pvp.set(matchId, { ...(pvp.get(matchId) || {}), playerA: log.args.playerA, countryA: Number(log.args.countryA) });
      });

      pvpJoinedLogs.forEach((log) => {
        const matchId = log.args.matchId.toString();
        const row = getManager(log.args.playerB);
        if (row) {
          row.countryId ||= Number(log.args.countryB);
          touch(row, log.blockNumber);
        }
        pvp.set(matchId, { ...(pvp.get(matchId) || {}), playerB: log.args.playerB, countryB: Number(log.args.countryB) });
      });

      pvpSettledLogs.forEach((log) => {
        const match = pvp.get(log.args.matchId.toString());
        if (!match?.playerA || !match?.playerB) return;
        const winnerKey = log.args.winner?.toLowerCase?.();
        const playerAKey = match.playerA.toLowerCase();
        const winner = getManager(log.args.winner);
        const loser = getManager(winnerKey === playerAKey ? match.playerB : match.playerA);
        if (winner) {
          winner.points += log.args.winnerPoints || 0n;
          winner.matches += 1;
          winner.wins += 1;
          touch(winner, log.blockNumber);
        }
        if (loser) {
          loser.points += log.args.loserPoints || 0n;
          loser.matches += 1;
          touch(loser, log.blockNumber);
        }
      });

      marketIntentLogs.forEach((log) => {
        const row = getManager(log.args.proposer);
        if (!row) return;
        row.countryId ||= Number(log.args.countryA);
        row.points += 18n;
        touch(row, log.blockNumber);
      });

      liveMarketLogs.forEach((log) => {
        const row = getManager(log.args.creator);
        if (!row) return;
        row.points += 22n;
        touch(row, log.blockNumber);
      });

      liveStakeLogs.forEach((log) => {
        const row = getManager(log.args.player);
        if (!row) return;
        row.points += 20n;
        touch(row, log.blockNumber);
      });

      applyLocalManagers(managers);

      const rows = Array.from(managers.values())
        .filter((row) => row.points > 0n || row.passports || row.matches)
        .sort((a, b) => {
          const pointsDelta = Number(b.points - a.points);
          if (pointsDelta) return pointsDelta;
          return Number(b.lastBlock - a.lastBlock);
        })
        .map((row, index) => ({ ...row, rank: index + 1 }));

      setManagerRows(rows);
      if (!rows.length) {
        setManagerError("No recent manager events found yet. The country board is live; manager rows appear after indexed wallet events.");
      }
    } catch (err) {
      const managers = new Map();
      applyLocalManagers(managers);
      const rows = Array.from(managers.values()).map((row, index) => ({ ...row, rank: index + 1 }));
      setManagerRows(rows);
      setManagerError(rows.length ? "Showing recent local manager activity while X Layer logs catch up." : err?.shortMessage || err?.message || "Could not load manager leaderboard from X Layer logs.");
    } finally {
      setManagerLoading(false);
    }
  }

  useEffect(() => {
    loadManagers();
    const timer = setInterval(loadManagers, 15000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient]);

  return (
    <div className="mx-auto max-w-[1560px] p-5 md:p-10 space-y-8">
      <section className="border-b border-border pb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Standings</div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-5xl uppercase italic leading-none md:text-7xl">
              Global <span className="text-primary">Leaderboard</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Countries aggregate every manager inside the FanDAO. Managers are wallet-linked players from live X Layer events.
            </p>
          </div>
          <button onClick={() => { refetch(); loadManagers(); }} className="border border-border bg-card px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] hover:bg-muted">
            Refresh Live Data
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success"></span>
          {isLoading || managerLoading ? "Reading X Layer..." : `Live update ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : ""}`}
        </div>
      </section>

      <div className="inline-flex border border-border bg-card p-1">
        <button
          onClick={() => setTab("countries")}
          className={`px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${tab === "countries" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Countries
        </button>
        <button
          onClick={() => setTab("managers")}
          className={`px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${tab === "managers" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Managers
        </button>
      </div>

      {tab === "countries" ? (
        <div className="overflow-hidden border border-border bg-card">
          <div className="grid grid-cols-[80px_1fr_160px] gap-4 border-b border-border bg-muted/40 px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:grid-cols-[120px_1fr_180px_120px]">
            <span>Rank</span>
            <span>Country</span>
            <span className="text-right">FanDAO Points</span>
            <span className="hidden text-right md:block">Managers</span>
          </div>
          {countryRows.map((item) => {
            const managerCount = managerRows.filter((manager) => manager.countryId === item.id).length;
            return (
              <div key={item.id} className="grid grid-cols-[80px_1fr_160px] items-center gap-4 border-b border-border px-5 py-5 last:border-b-0 md:grid-cols-[120px_1fr_180px_120px]">
                <span className={`font-display text-3xl uppercase italic ${item.rank <= 3 ? "text-primary" : ""}`}>#{item.rank}</span>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs">{item.flag}</span>
                    <span className="text-xl font-bold">{item.country} FanDAO</span>
                  </div>
                  {item.country === "Nigeria" && <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">Your country, shared by every Nigeria manager</div>}
                </div>
                <span className="text-right font-display text-3xl uppercase italic">{formatPoints(item.points)}</span>
                <span className="hidden text-right font-mono text-xs uppercase tracking-widest text-muted-foreground md:block">{managerCount || "-"} managers</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden border border-border bg-card">
          <div className="grid grid-cols-[80px_1fr_130px_90px_140px] gap-4 border-b border-border bg-muted/40 px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Rank</span>
            <span>Manager / wallet</span>
            <span>Country</span>
            <span className="text-right">Wins</span>
            <span className="text-right">Pts</span>
          </div>

          {managerRows.map((manager) => {
            const country = countryById.get(manager.countryId);
            const isYou = lowerAddress && manager.address.toLowerCase() === lowerAddress;
            return (
              <div
                key={manager.address}
                className={`grid grid-cols-[80px_1fr_130px_90px_140px] items-center gap-4 border-b border-border px-5 py-5 last:border-b-0 ${isYou ? "bg-primary/15" : ""}`}
              >
                <span className={`font-display text-3xl uppercase italic ${manager.rank <= 3 ? "text-primary" : ""}`}>#{manager.rank}</span>
                <div>
                  <div className="text-lg font-bold">
                    {managerName(manager.address)} {isYou && <span className="text-primary">(you)</span>}
                  </div>
                  <a href={explorerAddress(manager.address)} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">
                    {shortAddress(manager.address)}
                  </a>
                </div>
                <span className="font-mono text-xs uppercase tracking-widest">
                  {country ? `${country.flag} ${country.country}` : "Unknown"}
                </span>
                <span className="text-right font-mono text-sm">{manager.wins}/{manager.matches}</span>
                <span className="text-right font-display text-3xl uppercase italic">{formatPoints(manager.points)}</span>
              </div>
            );
          })}

          {!managerLoading && managerRows.length === 0 && (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              No managers found yet. Mint a passport, mint a squad, play Quick Battle, join PvP, or post a market intent to appear here.
            </div>
          )}
        </div>
      )}

      {managerError && <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{managerError}</div>}
    </div>
  );
}
