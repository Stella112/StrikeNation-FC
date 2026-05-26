"use client";

import { useEffect, useMemo, useState } from "react";
import { wrapFetchWithPaymentFromConfig } from "@okxweb3/x402-fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@okxweb3/x402-evm";
import { decodeEventLog, encodePacked, keccak256, parseAbiItem, stringToHex } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { agentAbi, arenaAbi, contracts, explorerAddress, explorerTx, passportAbi, xLayer } from "@/lib/contracts";

const countries = [
  { name: "Nigeria", id: 1, flag: "🇳🇬", identity: "Underdog speed", score: 1240 },
  { name: "Brazil", id: 2, flag: "🇧🇷", identity: "Creative pressure", score: 1390 },
  { name: "Argentina", id: 3, flag: "🇦🇷", identity: "Calm finishers", score: 1315 },
  { name: "England", id: 4, flag: "🏴", identity: "Set-piece machine", score: 1188 },
  { name: "Japan", id: 6, flag: "🇯🇵", identity: "Technical tempo", score: 1264 },
  { name: "South Korea", id: 7, flag: "🇰🇷", identity: "High press engine", score: 1237 },
  { name: "Saudi Arabia", id: 8, flag: "🇸🇦", identity: "Counter strike", score: 1168 },
  { name: "Qatar", id: 9, flag: "🇶🇦", identity: "Host nation nerve", score: 1086 },
  { name: "Iran", id: 10, flag: "🇮🇷", identity: "Compact defense", score: 1134 },
  { name: "Australia", id: 11, flag: "🇦🇺", identity: "AFC grit", score: 1129 },
  { name: "Indonesia", id: 12, flag: "🇮🇩", identity: "Fan wave", score: 1068 },
  { name: "India", id: 13, flag: "🇮🇳", identity: "Rising crowd", score: 1024 },
  { name: "China", id: 14, flag: "🇨🇳", identity: "Pressure build", score: 1017 },
  { name: "Underdog", id: 5, flag: "🌍", identity: "Chaos market", score: 1112 },
];

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";
}

function profileKey(address) {
  return address ? `strikenation-profile-${address.toLowerCase()}` : "strikenation-profile-guest";
}

function parseAgentId(receipt) {
  const eventAbi = parseAbiItem(
    "event StrikeAgentCreated(address indexed owner,uint256 indexed agentId,uint8 indexed country,string name,string playstyle,bytes32 promptHash)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "StrikeAgentCreated") return Number(parsed.args.agentId);
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

function parseSquadMint(receipt) {
  const eventAbi = parseAbiItem(
    "event StrikeSquadMinted(address indexed owner,uint8 indexed country,uint256 firstAgentId,uint256 lastAgentId)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "StrikeSquadMinted") {
        return {
          firstAgentId: Number(parsed.args.firstAgentId),
          lastAgentId: Number(parsed.args.lastAgentId),
        };
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

function parseBattleResult(receipt) {
  const eventAbi = parseAbiItem(
    "event InstantBattleResult(uint256 indexed battleId,bool won,bool predictionCorrect,uint256 points)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "InstantBattleResult") {
        return {
          won: parsed.args.won,
          predictionCorrect: parsed.args.predictionCorrect,
          points: Number(parsed.args.points),
        };
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

function parseAgentMatchResult(receipt) {
  const eventAbi = parseAbiItem(
    "event AgentMatchSettled(uint256 indexed battleId,address indexed player,uint8 indexed opponentCountry,bool won,uint8 scoreUser,uint8 scoreAgent,uint256 points)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "AgentMatchSettled") {
        return {
          battleId: Number(parsed.args.battleId),
          won: parsed.args.won,
          scoreUser: Number(parsed.args.scoreUser),
          scoreAgent: Number(parsed.args.scoreAgent),
          points: Number(parsed.args.points),
        };
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

function parseCourtMatchId(receipt) {
  const eventAbi = parseAbiItem(
    "event CourtMatchCreated(uint256 indexed matchId,address indexed playerA,uint256 indexed agentA,uint8 countryA,bytes32 strategyA)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "CourtMatchCreated") return Number(parsed.args.matchId);
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

function parseCourtResult(receipt) {
  const eventAbi = parseAbiItem(
    "event CourtMatchSettled(uint256 indexed matchId,address indexed winner,uint8 scoreA,uint8 scoreB,uint256 winnerPoints,uint256 loserPoints)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "CourtMatchSettled") {
        return {
          winner: parsed.args.winner,
          scoreA: Number(parsed.args.scoreA),
          scoreB: Number(parsed.args.scoreB),
          winnerPoints: Number(parsed.args.winnerPoints),
          loserPoints: Number(parsed.args.loserPoints),
        };
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

export default function StrikeNationClient() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient({ chainId: xLayer.id });

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [passportMinted, setPassportMinted] = useState(false);
  const [agent, setAgent] = useState(null);
  const [agentName, setAgentName] = useState("Naija Finisher");
  const [agentStyle, setAgentStyle] = useState("Calm Finisher");
  const [squad, setSquad] = useState([]);
  const [profile, setProfile] = useState({
    name: "New Fan",
    handle: "@striker",
    role: "FanDAO striker",
    avatar: "SN",
  });
  const [recommendation, setRecommendation] = useState({
    direction: "left",
    power: 78,
    risk: "medium",
    marketMove: "YES",
    reason: "Nigeria should use a controlled left shot and back the country market while momentum is favorable.",
    commentary: "Naija Finisher steps up with the country behind every strike.",
    source: "local-fallback",
  });
  const [marketPick, setMarketPick] = useState("YES");
  const [scores, setScores] = useState(countries);
  const [message, setMessage] = useState("Connect wallet, join a country FanDAO, then deploy your Strike Agent.");
  const [pendingHash, setPendingHash] = useState(null);
  const [busy, setBusy] = useState("");
  const [courtMatchId, setCourtMatchId] = useState("");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [battleMode, setBattleMode] = useState("quick");
  const [lastMatch, setLastMatch] = useState(null);
  const [premiumScout, setPremiumScout] = useState(null);

  const { data: passportId, refetch: refetchPassport } = useReadContract({
    address: contracts.FanPassportNFT,
    abi: passportAbi,
    functionName: "passportOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: squadIds, refetch: refetchSquad } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "squadOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: hasMintedSquad } = useReadContract({
    address: contracts.StrikeAgentNFT,
    abi: agentAbi,
    functionName: "hasMintedSquad",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const livePassport = Boolean(passportId && passportId > 0n);
  const isXLayer = chainId === xLayer.id;
  const canTransact = isConnected && isXLayer;
  const hasPassport = passportMinted || livePassport;
  const hasSquad = Boolean(hasMintedSquad) || squad.length === 11 || (squadIds?.length || 0) >= 11;

  const captainAdvice = recommendation.reason;
  const captainCommentary = recommendation.commentary || "The arena is waiting for your agent's next moment.";
  const shotPlan = `${recommendation.direction} shot / ${recommendation.power} power / ${recommendation.risk} risk`;
  const leaderboard = useMemo(() => [...scores].sort((a, b) => b.score - a.score), [scores]);
  const aiOpponent = useMemo(
    () => countries.find((country) => country.name === "Brazil" && country.id !== selectedCountry.id) || countries.find((country) => country.id !== selectedCountry.id),
    [selectedCountry.id],
  );
  const isMatchBusy = ["quick-battle", "court-create", "court-join", "court-settle"].includes(busy);

  useEffect(() => {
    const stored = window.localStorage.getItem(profileKey(address));
    if (stored) {
      setProfile(JSON.parse(stored));
      return;
    }

    setProfile({
      name: address ? `Fan ${address.slice(2, 6).toUpperCase()}` : "New Fan",
      handle: address ? `@${address.slice(2, 8).toLowerCase()}` : "@striker",
      role: "FanDAO striker",
      avatar: selectedCountry.flag,
    });
  }, [address, selectedCountry.flag]);

  function updateProfile(nextProfile) {
    setProfile(nextProfile);
    window.localStorage.setItem(profileKey(address), JSON.stringify(nextProfile));
  }

  useEffect(() => {
    if (!squadIds || squadIds.length < 11 || squad.length > 0) return;

    const restoredSquad = Array.from(squadIds).slice(0, 11).map((id, index) => ({
      id: Number(id),
      name: `${agentName} #${index + 1}`,
      role: index === 0 ? "Goalkeeper" : index <= 4 ? "Defender" : index <= 7 ? "Midfielder" : "Forward",
      country: selectedCountry.name,
      style: agentStyle,
      level: "Bronze",
      wins: 0,
      losses: 0,
      promptHash: "",
    }));
    setSquad(restoredSquad);
    setAgent(restoredSquad[9] || restoredSquad[0]);
  }, [agentName, agentStyle, selectedCountry.name, squad.length, squadIds]);

  async function connectWallet() {
    const connector = connectors[0];
    connect({ connector, chainId: xLayer.id });
  }

  async function getRecommendation(nextCountry = selectedCountry, nextAgent = agent) {
    setBusy("agent");
    const response = await fetch("/api/agent/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        country: nextCountry.name,
        opponent: "Brazil",
        agentName: nextAgent?.name || agentName,
        playstyle: nextAgent?.style || agentStyle,
        record: nextAgent ? `${nextAgent.wins}-${nextAgent.losses}` : "0-0",
        marketOdds: { yes: 56, no: 44 },
        leaderboard,
      }),
    });
    const nextRecommendation = await response.json();
    setRecommendation(nextRecommendation);
    setMarketPick(nextRecommendation.marketMove === "NO" ? "NO" : "YES");
    setBusy("");
  }

  async function mintPassport() {
    if (!canTransact) return;
    setBusy("passport");
    const hash = await writeContractAsync({
      address: contracts.FanPassportNFT,
      abi: passportAbi,
      functionName: "mintPassport",
      args: [selectedCountry.id],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    await publicClient.waitForTransactionReceipt({ hash });
    setPassportMinted(true);
    await refetchPassport();
    setMessage(`${selectedCountry.name} Fan Passport minted on X Layer. ${hash}`);
    setBusy("");
  }

  async function deployAgent(event) {
    event.preventDefault();
    if (!canTransact || !hasPassport) return;
    setBusy("agent-mint");
    const promptHash = keccak256(stringToHex(`${agentName}:${agentStyle}:${selectedCountry.name}`));
    const hash = await writeContractAsync({
      address: contracts.StrikeAgentNFT,
      abi: agentAbi,
      functionName: "createAgent",
      args: [agentName, selectedCountry.id, agentStyle, promptHash],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    setMessage(`Agent mint submitted on X Layer. ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const agentId = parseAgentId(receipt);
    const nextAgent = {
      id: agentId,
      name: agentName,
      style: agentStyle,
      country: selectedCountry.name,
      level: "Bronze",
      wins: 0,
      losses: 0,
      promptHash,
    };
    setAgent(nextAgent);
    await getRecommendation(selectedCountry, nextAgent);
    setBusy("");
  }

  async function mintSquad(event) {
    event.preventDefault();
    if (!canTransact || !hasPassport || hasSquad) return;
    setBusy("squad-mint");
    const promptHash = keccak256(stringToHex(`${agentName}:squad:${agentStyle}:${selectedCountry.name}`));
    const hash = await writeContractAsync({
      address: contracts.StrikeAgentNFT,
      abi: agentAbi,
      functionName: "createSquad",
      args: [agentName, selectedCountry.id, agentStyle, promptHash],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    setMessage(`Squad mint submitted on X Layer. ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const minted = parseSquadMint(receipt);
    const firstId = minted?.firstAgentId || 0;
    const squadPlayers = Array.from({ length: 11 }, (_, index) => ({
      id: firstId ? firstId + index : null,
      name: `${agentName} #${index + 1}`,
      role: index === 0 ? "Goalkeeper" : index <= 4 ? "Defender" : index <= 7 ? "Midfielder" : "Forward",
      country: selectedCountry.name,
      style: agentStyle,
      level: "Bronze",
      wins: 0,
      losses: 0,
      promptHash,
    }));
    const captain = squadPlayers[9] || squadPlayers[0];
    setSquad(squadPlayers);
    setAgent(captain);
    await refetchSquad();
    await getRecommendation(selectedCountry, captain);
    setMessage(`Full 11-agent squad minted for ${profile.name}. ${hash}`);
    setBusy("");
  }

  async function runQuickBattle() {
    if (!canTransact || !agent) return;
    setBusy("quick-battle");
    setLastMatch({
      mode: "quick",
      phase: "Agents entering the pitch",
      home: selectedCountry.name,
      away: `${aiOpponent.name} AI`,
    });
    if (!agent.id) {
      setMessage("Agent mint is confirmed, but its ID was not found yet. Refresh and deploy a new agent for a clean battle run.");
      setBusy("");
      return;
    }
    try {
      const strategyHash = keccak256(
        encodePacked(
          ["string", "uint256"],
          [`${agent.name}:${agent.style}:${shotPlan}:${recommendation.reason}`, BigInt(Date.now())],
        ),
      );
      setMessage("Quick Battle started. Confirm the wallet request, then the agents settle on X Layer.");
      const hash = await writeContractAsync({
        address: contracts.StrikeNationArena,
        abi: arenaAbi,
        functionName: "battleAgent",
        args: [BigInt(agent.id), aiOpponent.id, strategyHash, recommendation.power, marketPick === "YES"],
        chainId: xLayer.id,
      });
      setPendingHash(hash);
      setLastMatch((current) => ({ ...current, phase: "Shot submitted on X Layer" }));
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const result = parseAgentMatchResult(receipt) || parseBattleResult(receipt);
      const won = result?.won ?? false;
      const points = result?.points ?? (won ? 187 : 55);
      setScores((current) =>
        current.map((country) =>
          country.id === selectedCountry.id ? { ...country, score: country.score + points } : country,
        ),
      );
      setAgent((current) =>
        current
          ? {
              ...current,
              wins: current.wins + (won ? 1 : 0),
              losses: current.losses + (won ? 0 : 1),
              level: won ? "Silver" : current.level,
            }
          : current,
      );
      setLastMatch({
        mode: "quick",
        phase: won ? "Goal confirmed" : "AI keeper wins the duel",
        home: selectedCountry.name,
        away: `${aiOpponent.name} AI`,
        scoreHome: result?.scoreUser,
        scoreAway: result?.scoreAgent,
        won,
      });
      const scoreLine =
        result?.scoreUser !== undefined ? ` ${selectedCountry.name} ${result.scoreUser}-${result.scoreAgent} ${aiOpponent.name} AI.` : "";
      setMessage(`${agent.name} finished a Quick Battle against ${aiOpponent.name} AI.${scoreLine} ${hash}`);
    } catch (error) {
      setLastMatch((current) => ({ ...current, phase: "Battle cancelled" }));
      setMessage(error?.shortMessage || error?.message || "Quick Battle was cancelled or failed.");
    } finally {
      setBusy("");
    }
  }

  async function createCourtMatch() {
    if (!canTransact || !agent?.id) return;
    setBusy("court-create");
    const strategyHash = keccak256(
      encodePacked(
        ["string", "uint256"],
        [`${agent.name}:${agent.style}:${shotPlan}:${recommendation.reason}:court`, BigInt(Date.now())],
      ),
    );
    const hash = await writeContractAsync({
      address: contracts.StrikeNationArena,
      abi: arenaAbi,
      functionName: "createCourtMatch",
      args: [BigInt(agent.id), strategyHash],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const matchId = parseCourtMatchId(receipt);
    if (matchId) {
      setCourtMatchId(String(matchId));
      setJoinMatchId(String(matchId));
    }
    setMessage(`Court match created. Share Match ID ${matchId || "from explorer"} with a second wallet. ${hash}`);
    setBusy("");
  }

  async function joinCourtMatch() {
    if (!canTransact || !agent?.id || !joinMatchId) return;
    setBusy("court-join");
    const strategyHash = keccak256(
      encodePacked(
        ["string", "uint256"],
        [`${agent.name}:${agent.style}:${shotPlan}:${recommendation.reason}:join`, BigInt(Date.now())],
      ),
    );
    const hash = await writeContractAsync({
      address: contracts.StrikeNationArena,
      abi: arenaAbi,
      functionName: "joinCourtMatch",
      args: [BigInt(joinMatchId), BigInt(agent.id), strategyHash],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    await publicClient.waitForTransactionReceipt({ hash });
    setCourtMatchId(joinMatchId);
    setMessage(`Second wallet joined Court Match #${joinMatchId}. Now either wallet can settle the autonomous agent battle. ${hash}`);
    setBusy("");
  }

  async function settleCourtMatch() {
    const matchId = courtMatchId || joinMatchId;
    if (!canTransact || !matchId) return;
    setBusy("court-settle");
    setLastMatch({
      mode: "pvp",
      phase: "PvP agents settling the court",
      home: selectedCountry.name,
      away: "Rival wallet",
    });
    try {
      const hash = await writeContractAsync({
        address: contracts.StrikeNationArena,
        abi: arenaAbi,
        functionName: "settleCourtMatch",
        args: [BigInt(matchId)],
        chainId: xLayer.id,
      });
      setPendingHash(hash);
      setLastMatch((current) => ({ ...current, phase: "PvP result submitted on X Layer" }));
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const result = parseCourtResult(receipt);
      if (result) {
        const userWon = result.winner?.toLowerCase() === address?.toLowerCase();
        const points = userWon ? result.winnerPoints : result.loserPoints;
        setScores((current) =>
          current.map((country) =>
            country.id === selectedCountry.id ? { ...country, score: country.score + points } : country,
          ),
        );
        setAgent((current) =>
          current
            ? {
                ...current,
                wins: current.wins + (userWon ? 1 : 0),
                losses: current.losses + (userWon ? 0 : 1),
                level: userWon ? "Silver" : current.level,
              }
            : current,
        );
        setLastMatch({
          mode: "pvp",
          phase: userWon ? "Your squad wins" : "Rival squad wins",
          home: selectedCountry.name,
          away: "Rival wallet",
          scoreHome: result.scoreA,
          scoreAway: result.scoreB,
          won: userWon,
        });
        setMessage(`Court Match #${matchId} settled autonomously: ${result.scoreA}-${result.scoreB}. ${hash}`);
      } else {
        setMessage(`Court Match #${matchId} settled on X Layer. ${hash}`);
      }
    } catch (error) {
      setLastMatch((current) => ({ ...current, phase: "Settlement cancelled" }));
      setMessage(error?.shortMessage || error?.message || "Court settlement was cancelled or failed.");
    } finally {
      setBusy("");
    }
  }

  async function placePrediction(choice) {
    if (!canTransact || !agent) return;
    setBusy(`prediction-${choice}`);
    setMarketPick(choice);
    const hash = await writeContractAsync({
      address: contracts.StrikeNationArena,
      abi: arenaAbi,
      functionName: "placePrediction",
      args: [selectedCountry.id, 2, choice === "YES"],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    await publicClient.waitForTransactionReceipt({ hash });
    setScores((current) =>
      current.map((country) =>
        country.id === selectedCountry.id ? { ...country, score: country.score + (choice === "YES" ? 42 : 24) } : country,
      ),
    );
    setMessage(`${agent.name} backed ${choice} in the side market. ${hash}`);
    setBusy("");
  }

  async function proposeExchangeOSMarket() {
    if (!canTransact || !hasPassport) return;
    setBusy("exchange-os");
    const matchId = courtMatchId || joinMatchId || "0";
    const question = `Will ${selectedCountry.name} FanDAO beat Brazil in the next autonomous court?`;
    const strategyHash = keccak256(
      encodePacked(
        ["string", "uint256"],
        [`${question}:${agent?.name || "AI Captain"}:${recommendation.marketMove}:${recommendation.reason}`, BigInt(Date.now())],
      ),
    );
    const hash = await writeContractAsync({
      address: contracts.StrikeNationArena,
      abi: arenaAbi,
      functionName: "proposeExchangeOSMarket",
      args: [BigInt(matchId), selectedCountry.id, 2, question, strategyHash],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    await publicClient.waitForTransactionReceipt({ hash });
    setScores((current) =>
      current.map((country) =>
        country.id === selectedCountry.id ? { ...country, score: country.score + 18 } : country,
      ),
    );
    setMessage(`Exchange OS-ready market intent posted on X Layer: ${question}. ${hash}`);
    setBusy("");
  }

  async function requestPremiumScout() {
    setBusy("premium-scout");
    try {
      const paidFetch = walletClient
        ? wrapFetchWithPaymentFromConfig(fetch, {
            schemes: [
              {
                network: "eip155:196",
                client: new ExactEvmScheme(toClientEvmSigner(walletClient)),
              },
            ],
          })
        : fetch;
      const response = await paidFetch("/api/agent/premium-scout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry.name,
          opponent: "Brazil",
          agentName: agent?.name || agentName,
          playstyle: agent?.style || agentStyle,
          record: agent ? `${agent.wins}-${agent.losses}` : "0-0",
          marketOdds: { yes: 56, no: 44 },
          courtMatchId: courtMatchId || joinMatchId || null,
        }),
      });
      const data = await response.json();
      setPremiumScout(data);
      setMessage(
        response.status === 402
          ? "Premium Scout is protected by x402. Connect an X Layer wallet with USDT0 to sign the payment."
          : response.ok
            ? "Premium Scout report unlocked through x402."
            : "Premium Scout request finished, but OKX did not confirm payment.",
      );
    } catch (error) {
      setPremiumScout({
        error: "x402_payment_failed",
        message: error?.message || "Payment failed. Check wallet network, USDT0 balance, and signature approval.",
      });
      setMessage("x402 payment failed. Check wallet network, USDT0 balance, and signature approval.");
    }
    setBusy("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="StrikeNation navigation">
        <div className="brand">
          <img className="brand-logo" src="/assets/strikenation-logo.jpeg" alt="StrikeNation FC logo" />
          <div>
            <strong>StrikeNation FC</strong>
            <span>World Cup AI arena</span>
          </div>
        </div>

        <nav className="nav-list">
          <a href="#arena" className="active">
            Arena
          </a>
          <a href="#profile">Profile</a>
          <a href="#fandao">FanDAO</a>
          <a href="#agent">Agent</a>
          <a href="#battle">Battle</a>
          <a href="#market">Market</a>
        </nav>

        <div className="captain-card">
          <span className="eyebrow">AI Captain</span>
          <p>{captainAdvice}</p>
          <p className="captain-hype">{captainCommentary}</p>
        </div>
      </aside>

      <main>
        <section className="hero" id="arena">
          <div className="hero-media" aria-hidden="true">
            <img src="/assets/strikenation-logo.jpeg" alt="" />
          </div>

          <div className="hero-copy">
            <span className="eyebrow">X Layer mainnet MVP</span>
            <h1>AI agents battle for your country on X Layer.</h1>
            <p>
              Join a national FanDAO, mint your passport, deploy a Claude-powered Strike Agent, win penalty
              battles, predict outcomes, and evolve your NFT.
            </p>
            <div className="hero-actions">
              {isConnected ? (
                <button className="secondary-btn" onClick={() => disconnect()}>
                  Disconnect
                </button>
              ) : (
                <button className="primary-btn" onClick={connectWallet} disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect OKX Wallet"}
                </button>
              )}
              <button
                className="secondary-btn"
                onClick={() => switchChain({ chainId: xLayer.id })}
                disabled={!isConnected || isXLayer || isSwitching}
              >
                {isXLayer ? "X Layer Active" : "Switch X Layer"}
              </button>
              <button className="secondary-btn" onClick={() => getRecommendation()} disabled={busy === "agent"}>
                {busy === "agent" ? "Thinking..." : "Ask AI Captain"}
              </button>
            </div>
          </div>

          <div className="status-strip">
            <div>
              <span>Wallet</span>
              <strong>{profile.name}</strong>
            </div>
            <div>
              <span>FanDAO</span>
              <strong>{hasPassport ? `${selectedCountry.name} Passport` : selectedCountry.name}</strong>
            </div>
            <div>
              <span>Agent</span>
              <strong>{agent ? `${agent.name} / ${agent.level}` : "Undeployed"}</strong>
            </div>
            <div>
              <span>Network</span>
              <strong>{isXLayer ? "X Layer mainnet" : "Switch required"}</strong>
            </div>
          </div>
        </section>

        <section className="profile-panel" id="profile">
          <div className="profile-card">
            <div className="profile-avatar">{profile.avatar || selectedCountry.flag}</div>
            <div>
              <span className="eyebrow">Player profile</span>
              <h2>{profile.name}</h2>
              <p>
                {profile.handle} / {profile.role} / {shortAddress(address)}
              </p>
            </div>
          </div>
          <div className="profile-form">
            <label>
              Display name
              <input
                value={profile.name}
                maxLength={24}
                onChange={(event) => updateProfile({ ...profile, name: event.target.value })}
              />
            </label>
            <label>
              X handle
              <input
                value={profile.handle}
                maxLength={24}
                onChange={(event) => updateProfile({ ...profile, handle: event.target.value })}
              />
            </label>
            <label>
              Role
              <select value={profile.role} onChange={(event) => updateProfile({ ...profile, role: event.target.value })}>
                <option>FanDAO striker</option>
                <option>AI captain</option>
                <option>Market scout</option>
                <option>Penalty keeper</option>
                <option>Country ultra</option>
              </select>
            </label>
            <label>
              Avatar
              <input
                value={profile.avatar}
                maxLength={4}
                onChange={(event) => updateProfile({ ...profile, avatar: event.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="chain-panel">
          <img src="/assets/strikenation-logo.jpeg" alt="StrikeNation FC logo" />
          <div>
            <span className="eyebrow">Mainnet contracts</span>
            <h2>Live on X Layer</h2>
            <p>Core contracts are deployed and smoke-tested with real mainnet transactions.</p>
            <div className="chain-links">
              {Object.entries(contracts).map(([name, addressValue]) => (
                <a key={name} href={explorerAddress(addressValue)} target="_blank" rel="noreferrer">
                  {name}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="panel" id="fandao">
          <div className="section-head">
            <div>
              <span className="eyebrow">Step 1</span>
              <h2>Join a Country FanDAO</h2>
            </div>
            <button className="primary-btn small" disabled={!canTransact || hasPassport || busy === "passport"} onClick={mintPassport}>
              {busy === "passport" ? "Minting..." : hasPassport ? "Passport Found" : "Mint Fan Passport"}
            </button>
          </div>
          <div className="country-grid">
            {countries.map((country) => (
              <button
                key={country.name}
                type="button"
                className={`country-card ${selectedCountry.id === country.id ? "selected" : ""}`}
                onClick={() => setSelectedCountry(country)}
              >
                <div>
                  <div className="country-flag">{country.flag}</div>
                  <strong>{country.name} FanDAO</strong>
                  <span>{country.identity}</span>
                </div>
                <span>{country.score.toLocaleString()} pts</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid-two">
          <div className="panel" id="agent">
            <div className="section-head">
              <div>
                <span className="eyebrow">Step 2</span>
                <h2>Mint 11-Agent Squad</h2>
              </div>
            </div>
            <form className="agent-form" onSubmit={mintSquad}>
              <label>
                Squad name
                <input value={agentName} maxLength={28} onChange={(event) => setAgentName(event.target.value)} />
              </label>
              <label>
                Playstyle
                <select value={agentStyle} onChange={(event) => setAgentStyle(event.target.value)}>
                  <option>Calm Finisher</option>
                  <option>High Risk Sniper</option>
                  <option>Data Driven Keeper</option>
                  <option>Underdog Hunter</option>
                </select>
              </label>
              <button className="primary-btn" type="submit" disabled={!canTransact || !hasPassport || hasSquad || busy === "squad-mint"}>
                {busy === "squad-mint" ? "Minting 11..." : hasSquad ? "Squad Minted" : "Mint 11 Agents"}
              </button>
            </form>

            <div className="agent-card">
              <span className="card-label">Strike Squad NFTs</span>
              <h3>{squad.length ? `${squad.length} players minted` : agent ? agent.name : "No squad deployed"}</h3>
              <p>
                {squad.length
                  ? `${selectedCountry.name} squad / ${agentStyle} / owned by ${profile.name}`
                  : "Mint your full 11-player AI squad after joining a FanDAO."}
              </p>
              <div className="agent-stats">
                <span>Level: {agent ? agent.level : "-"}</span>
                <span>Record: {agent ? `${agent.wins}-${agent.losses}` : "-"}</span>
                <span>Brain: {recommendation.source === "claude" ? "Claude" : "Fallback"}</span>
              </div>
            </div>
            <div className="tee-note">
              <strong>TEE-ready autonomy</strong>
              <span>
                Squad decisions are generated off-chain today and hashed on-chain. The execution layer is designed to
                move into a Trusted Execution Environment for private, verifiable agent runs.
              </span>
            </div>
            <div className="squad-grid">
              {(squad.length ? squad : Array.from({ length: 11 }, (_, index) => ({
                name: `Player ${index + 1}`,
                role: index === 0 ? "Goalkeeper" : index <= 4 ? "Defender" : index <= 7 ? "Midfielder" : "Forward",
              }))).map((player, index) => (
                <div className={`squad-player ${squad.length ? "minted" : ""}`} key={`${player.name}-${index}`}>
                  <span>{index + 1}</span>
                  <strong>{player.name}</strong>
                  <small>{player.role}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" id="battle">
            <div className="section-head">
              <div>
                <span className="eyebrow">Step 3</span>
                <h2>Battle Arena</h2>
              </div>
            </div>
            <div className="court-explainer">
              Choose Quick Battle for an instant user-vs-AI match, or Challenge Player for a real two-wallet match.
              Both modes use AI strategy and settle results on X Layer.
            </div>
            <div className="battle-mode-grid" aria-label="Battle modes">
              <button
                type="button"
                className={`mode-card ${battleMode === "quick" ? "selected" : ""}`}
                onClick={() => setBattleMode("quick")}
              >
                <span>Default mode</span>
                <strong>Quick Battle</strong>
                <small>Play against an AI-controlled Strike Agent instantly.</small>
              </button>
              <button
                type="button"
                className={`mode-card ${battleMode === "pvp" ? "selected" : ""}`}
                onClick={() => setBattleMode("pvp")}
              >
                <span>Multiplayer</span>
                <strong>Challenge Player</strong>
                <small>Create or join a match against another real wallet.</small>
              </button>
            </div>
            <div className={`football-court ${isMatchBusy ? "is-battling" : ""}`} aria-label="Autonomous football court">
              <div className="match-status">
                <span>{isMatchBusy ? "Live action" : lastMatch ? "Last result" : "Ready"}</span>
                <strong>{isMatchBusy ? lastMatch?.phase || "Agents are moving" : lastMatch?.phase || "Choose a battle mode"}</strong>
              </div>
              <div className="goal goal-left">Goal</div>
              <div className="goal goal-right">Goal</div>
              <div className="center-circle"></div>
              <div className="shot-trail"></div>
              <div className="agent-piece agent-home">
                <span>{profile.avatar || selectedCountry.flag}</span>
                <strong>{agent?.name || "Your Agent"}</strong>
                <small>{profile.name}</small>
              </div>
              <div className="agent-piece agent-away">
                <span>{battleMode === "quick" ? aiOpponent.flag : "?"}</span>
                <strong>
                  {battleMode === "quick" ? `${aiOpponent.name} AI` : courtMatchId || joinMatchId ? "Rival Joined" : "Waiting"}
                </strong>
                <small>{battleMode === "quick" ? "Autonomous squad" : "Second wallet"}</small>
              </div>
              <div className="court-ball"></div>
              {lastMatch?.scoreHome !== undefined && (
                <div className={`court-score ${lastMatch.won ? "won" : "lost"}`}>
                  <span>{lastMatch.home}</span>
                  <strong>
                    {lastMatch.scoreHome}-{lastMatch.scoreAway}
                  </strong>
                  <span>{lastMatch.away}</span>
                </div>
              )}
            </div>
            <div className="match-card">
              <div className="team-block">
                <strong>{selectedCountry.name}</strong>
                <span>FanDAO</span>
              </div>
              <div className="versus">vs</div>
              <div className="team-block away">
                <strong>{battleMode === "quick" ? aiOpponent.name : "Player Wallet"}</strong>
                <span>{battleMode === "quick" ? "AI squad" : "FanDAO rival"}</span>
              </div>
            </div>

            <div className="shot-panel">
              <div>
                <span className="eyebrow">Agent move</span>
                <strong>{shotPlan}</strong>
                <p>{captainCommentary}</p>
              </div>
              {battleMode === "quick" ? (
                <button className="primary-btn" onClick={runQuickBattle} disabled={!canTransact || !agent?.id || busy === "quick-battle"}>
                  {busy === "quick-battle" ? "Battling..." : "Start Quick Battle"}
                </button>
              ) : (
                <button className="primary-btn" onClick={createCourtMatch} disabled={!canTransact || !agent?.id || busy === "court-create"}>
                  {busy === "court-create" ? "Opening..." : "Challenge Player"}
                </button>
              )}
            </div>

            {battleMode === "pvp" && (
              <div className="court-actions">
                <label>
                  Match ID for second wallet
                  <input value={joinMatchId} onChange={(event) => setJoinMatchId(event.target.value)} placeholder="Paste match ID" />
                </label>
                <button className="secondary-btn" onClick={joinCourtMatch} disabled={!canTransact || !agent?.id || !joinMatchId || busy === "court-join"}>
                  {busy === "court-join" ? "Joining..." : "Join Court"}
                </button>
                <button
                  className="primary-btn"
                  onClick={settleCourtMatch}
                  disabled={!canTransact || !(courtMatchId || joinMatchId) || busy === "court-settle"}
                >
                  {busy === "court-settle" ? "Settling..." : "Settle Court"}
                </button>
              </div>
            )}

            <div className="premium-scout">
              <div>
                <span className="eyebrow">x402 premium</span>
                <h3>Paid Agent Scout</h3>
                <p>
                  x402 protects the deeper AI report before Claude runs. This is the monetized service layer for agents,
                  not the court settlement itself.
                </p>
              </div>
              <button className="secondary-btn" onClick={requestPremiumScout} disabled={busy === "premium-scout"}>
                {busy === "premium-scout" ? "Requesting..." : "Premium Scout"}
              </button>
              {premiumScout && (
                <div className="scout-report">
                  {premiumScout.error ? (
                    <>
                      <strong>x402 payment required</strong>
                      <span>
                        {premiumScout.payment?.price} on {premiumScout.payment?.network}
                      </span>
                      <span>{premiumScout.message}</span>
                    </>
                  ) : (
                    <>
                      <strong>{premiumScout.summary}</strong>
                      <span>Weakness: {premiumScout.opponentWeakness}</span>
                      <span>Plan: {premiumScout.recommendedCourtPlan}</span>
                      <span>Market: {premiumScout.suggestedMarket}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="battle-log">
              {message.includes("0x") ? (
                <>
                  {message.split("0x")[0]}
                  <a className="tx-link" href={explorerTx(`0x${message.split("0x")[1]}`)} target="_blank" rel="noreferrer">
                    View transaction
                  </a>
                </>
              ) : (
                message
              )}
            </div>
          </div>
        </section>

        <section className="grid-two">
          <div className="panel" id="market">
            <div className="section-head">
              <div>
                <span className="eyebrow">Step 4</span>
                <h2>Exchange OS-Ready Market</h2>
              </div>
            </div>
            <div className="market-card">
              <p>Will {selectedCountry.name} FanDAO beat Brazil today?</p>
              <div className="market-note">
                Agents can post on-chain market intents today, ready to route into Exchange OS outcome venues as builder
                access opens.
              </div>
              <div className="market-actions">
                <button className="secondary-btn" disabled={!canTransact || !agent || busy === "prediction-YES"} onClick={() => placePrediction("YES")}>
                  Back YES
                </button>
                <button className="secondary-btn" disabled={!canTransact || !agent || busy === "prediction-NO"} onClick={() => placePrediction("NO")}>
                  Back NO
                </button>
                <button className="primary-btn" disabled={!canTransact || !hasPassport || busy === "exchange-os"} onClick={proposeExchangeOSMarket}>
                  {busy === "exchange-os" ? "Posting..." : "Post Market Intent"}
                </button>
              </div>
              <div className="odds-row">
                <span>YES 56%</span>
                <span>NO 44%</span>
                <span>AI: {recommendation.marketMove}</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <span className="eyebrow">Live table</span>
                <h2>Country Leaderboard</h2>
              </div>
            </div>
            <div className="leaderboard">
              {leaderboard.map((country, index) => (
                <div className="leader-row" key={country.name}>
                  <span className="rank">#{index + 1}</span>
                  <strong>{country.name} FanDAO</strong>
                  <span className="score">{country.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="share-panel">
          <div>
            <span className="eyebrow">Demo closer</span>
            <h2>Generated X Post</h2>
            <p>
              {agent
                ? `${captainCommentary} ${profile.name}'s ${agent.name} is battling for ${selectedCountry.name} FanDAO on StrikeNation FC. AI agents battle for national pride on X Layer. @XLayerOfficial`
                : "Deploy an agent to generate your result post."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
