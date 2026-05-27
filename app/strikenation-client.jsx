"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { wrapFetchWithPaymentFromConfig } from "@okxweb3/x402-fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@okxweb3/x402-evm";
import { decodeEventLog, encodePacked, keccak256, parseAbiItem, parseUnits, stringToHex } from "viem";
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
import { agentAbi, arenaAbi, contracts, erc20Abi, explorerAddress, explorerTx, passportAbi, xLayer } from "@/lib/contracts";

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

const liveFixtures = [
  {
    id: "wc26-opener",
    home: "Mexico",
    away: "South Africa",
    kickoff: "2026-06-11T19:00:00Z",
    venue: "Opening Match",
    focus: "opening pressure",
  },
  {
    id: "wc26-nigeria-brazil",
    home: "Nigeria",
    away: "Brazil",
    kickoff: "2026-06-14T20:00:00Z",
    venue: "FanDAO Rivalry",
    focus: "underdog upset",
  },
  {
    id: "wc26-japan-korea",
    home: "Japan",
    away: "South Korea",
    kickoff: "2026-06-16T18:00:00Z",
    venue: "AFC Derby",
    focus: "tempo battle",
  },
];

const formationDots = [
  { side: "home", role: "GK", x: 9, y: 50 },
  { side: "home", role: "LB", x: 20, y: 24 },
  { side: "home", role: "CB", x: 24, y: 43 },
  { side: "home", role: "CB", x: 24, y: 58 },
  { side: "home", role: "RB", x: 20, y: 76 },
  { side: "home", role: "CM", x: 38, y: 35 },
  { side: "home", role: "CM", x: 42, y: 52 },
  { side: "home", role: "AM", x: 38, y: 68 },
  { side: "home", role: "LW", x: 53, y: 25 },
  { side: "home", role: "ST", x: 58, y: 50 },
  { side: "home", role: "RW", x: 53, y: 76 },
  { side: "away", role: "GK", x: 91, y: 50 },
  { side: "away", role: "LB", x: 80, y: 24 },
  { side: "away", role: "CB", x: 76, y: 43 },
  { side: "away", role: "CB", x: 76, y: 58 },
  { side: "away", role: "RB", x: 80, y: 76 },
  { side: "away", role: "CM", x: 62, y: 35 },
  { side: "away", role: "CM", x: 58, y: 52 },
  { side: "away", role: "AM", x: 62, y: 68 },
  { side: "away", role: "LW", x: 47, y: 25 },
  { side: "away", role: "ST", x: 42, y: 50 },
  { side: "away", role: "RW", x: 47, y: 76 },
];

const commentaryTemplates = [
  ({ agentName, country, opponent, direction, power, minute }) =>
    `${minute}' ${agentName} checks the keeper twice. ${country} are shaping the attack toward the ${direction} lane.`,
  ({ country, opponent, minute }) => `${minute}' ${country} FanDAO pushes up. ${opponent} AI is leaving space behind midfield.`,
  ({ agentName, risk, minute }) => `${minute}' ${agentName} slows the tempo. The risk meter says ${risk}, but the body language says confidence.`,
  ({ country, power, minute }) => `${minute}' ${country} load the strike with ${power} power. That is not a casual shot.`,
  ({ opponent, minute }) => `${minute}' ${opponent} AI shifts the keeper early. The arena notices that little tell.`,
  ({ agentName, minute }) => `${minute}' ${agentName} fakes near post, then waits for the chain-side decision.`,
  ({ country, minute }) => `${minute}' The ${country} dots are moving as a unit now. The press is cleaner than before.`,
  ({ opponent, minute }) => `${minute}' ${opponent} AI tries to crowd the center circle, but the wings are open.`,
  ({ country, direction, minute }) => `${minute}' ${country} keep finding the ${direction} channel. The captain call is starting to make sense.`,
  ({ agentName, minute }) => `${minute}' ${agentName} is not rushing this. Tiny pause, big pressure.`,
  ({ country, minute }) => `${minute}' A wave of ${country} shirts steps forward. The crowd can feel a chance coming.`,
  ({ opponent, minute }) => `${minute}' ${opponent} AI almost reads it, but the timing is half a beat late.`,
];

const incidentTemplates = [
  {
    type: "penalty",
    label: "Penalty",
    tone: "kick",
    impact: "attacking",
    text: ({ country, agentName, minute }) => `${minute}' Penalty shout. ${agentName} is clipped in the box and ${country} are staring at the spot.`,
  },
  {
    type: "yellow",
    label: "Yellow card",
    tone: "whistle",
    impact: "balanced",
    text: ({ opponent, minute }) => `${minute}' Yellow card for ${opponent} AI after a late stop in midfield. The referee finally reaches the pocket.`,
  },
  {
    type: "red",
    label: "Red card",
    tone: "whistle",
    impact: "attacking",
    text: ({ opponent, minute }) => `${minute}' Red card drama. ${opponent} AI loses a defender and the whole match tilts toward the attack.`,
  },
  {
    type: "offside",
    label: "Offside",
    tone: "whistle",
    impact: "defensive",
    text: ({ agentName, minute }) => `${minute}' Offside flag goes up. ${agentName} had the timing by a hair, but the line held firm.`,
  },
  {
    type: "corner",
    label: "Corner",
    tone: "kick",
    impact: "attacking",
    text: ({ country, minute }) => `${minute}' Corner to ${country}. The center-backs are jogging up and the crowd noise rises.`,
  },
  {
    type: "free-kick",
    label: "Free kick",
    tone: "kick",
    impact: "attacking",
    text: ({ country, direction, minute }) => `${minute}' Free kick on the ${direction} side. ${country} are loading a set-piece routine.`,
  },
  {
    type: "var",
    label: "VAR check",
    tone: "whistle",
    impact: "balanced",
    text: ({ country, minute }) => `${minute}' VAR check. ${country} wait on the signal while the arena holds its breath.`,
  },
];

const evolvedRoles = {
  Goalkeeper: "Sweeper Keeper",
  Defender: "Ball-Winning Defender",
  Midfielder: "Pressing Playmaker",
  Forward: "Clinical Finisher",
};

function playMatchSound(kind) {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const master = context.createGain();
  master.gain.setValueAtTime(0.08, context.currentTime);
  master.connect(context.destination);

  function tone(frequency, start, duration, type = "sine", volume = 1) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.03);
  }

  if (kind === "whistle") {
    tone(1600, 0, 0.16, "square", 0.55);
    tone(1900, 0.18, 0.22, "square", 0.5);
  } else if (kind === "halftime") {
    tone(1500, 0, 0.18, "square", 0.5);
    tone(1500, 0.28, 0.18, "square", 0.5);
  } else if (kind === "fulltime") {
    tone(1700, 0, 0.14, "square", 0.52);
    tone(1700, 0.22, 0.14, "square", 0.52);
    tone(1700, 0.44, 0.28, "square", 0.52);
  } else if (kind === "kick") {
    tone(95, 0, 0.12, "triangle", 0.8);
    tone(260, 0.03, 0.08, "sine", 0.35);
  } else if (kind === "goal") {
    tone(520, 0, 0.12, "sawtooth", 0.4);
    tone(660, 0.12, 0.16, "sawtooth", 0.38);
    tone(880, 0.3, 0.28, "sawtooth", 0.34);
  } else if (kind === "save") {
    tone(180, 0, 0.18, "triangle", 0.55);
    tone(120, 0.16, 0.2, "triangle", 0.45);
  }

  window.setTimeout(() => context.close(), 900);
}

function fallbackScore(won, seed) {
  const base = Array.from(seed || "strikenation").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const winner = 1 + (base % 5);
  const loser = base % Math.min(winner, 4);
  return won ? { scoreUser: winner, scoreAgent: loser } : { scoreUser: loser, scoreAgent: winner };
}

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

function parseLiveMarketId(receipt) {
  const eventAbi = parseAbiItem(
    "event LiveMatchMarketPosted(uint256 indexed marketId,address indexed creator,string fixtureId,string homeTeam,string awayTeam,string question,uint64 kickoff,bytes32 agentIntentHash)",
  );

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName === "LiveMatchMarketPosted") return Number(parsed.args.marketId);
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
  const lastCommentaryRef = useRef("");

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
  const [commentaryFeed, setCommentaryFeed] = useState([
    "The arena is quiet for now. Pick a country, trust the AI Captain, and wait for the whistle.",
  ]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [matchMinute, setMatchMinute] = useState(0);
  const [matchFormat, setMatchFormat] = useState("Compressed 90");
  const [matchPhase, setMatchPhase] = useState("Pre-match");
  const [matchEvents, setMatchEvents] = useState([]);
  const [formationMode, setFormationMode] = useState("balanced");
  const [evolvedPlayerIds, setEvolvedPlayerIds] = useState([]);
  const [selectedFixture, setSelectedFixture] = useState(liveFixtures[0]);
  const [liveMarketId, setLiveMarketId] = useState("");
  const [livePick, setLivePick] = useState(0);
  const [stakeAmount, setStakeAmount] = useState("1");
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
  const activeFormationDots = useMemo(
    () =>
      formationDots.map((dot, index) => {
        const liveDrift = isMatchBusy ? Math.sin((matchMinute + index * 13) / 7) * 2.8 : 0;
        const roleDrift = dot.role.includes("W") ? 2.2 : dot.role.includes("M") ? 1.4 : 0.8;
        let x = dot.x;
        let y = dot.y + liveDrift;

        if (formationMode === "attacking") {
          x += dot.side === "home" ? roleDrift + 4 : -(roleDrift + 2);
        } else if (formationMode === "defensive") {
          x += dot.side === "home" ? -(roleDrift + 3) : roleDrift + 2;
        }

        return {
          ...dot,
          x: Math.max(6, Math.min(94, x)),
          y: Math.max(16, Math.min(84, y)),
        };
      }),
    [formationMode, isMatchBusy, matchMinute],
  );
  const agentMarketIdeas = useMemo(() => {
    const nextWindow = Math.min(90, Math.max(15, matchMinute + 15));
    const agentLabel = agent?.name || "AI Captain";
    return [
      {
        question: `Will ${selectedCountry.name} score before ${nextWindow}'?`,
        pick: recommendation.marketMove === "NO" ? "NO" : "YES",
        signal: `Claude reads ${recommendation.direction} pressure and ${recommendation.power} power.`,
      },
      {
        question: `Will there be a penalty or VAR check before full-time?`,
        pick: recommendation.risk === "high" ? "YES" : "NO",
        signal: `${agentLabel} watches box pressure and referee volatility.`,
      },
      {
        question: `Will ${agentLabel} finish with 2+ decisive attacking actions?`,
        pick: recommendation.power >= 72 ? "YES" : "NO",
        signal: `Agent role: ${agent?.role || agentStyle}. Current phase: ${matchPhase}.`,
      },
      {
        question: `Will ${aiOpponent.name} AI receive a card in this match?`,
        pick: matchMinute > 35 || recommendation.risk === "high" ? "YES" : "NO",
        signal: `Opponent pressure spikes when ${selectedCountry.name} overloads midfield.`,
      },
    ];
  }, [agent, agentStyle, aiOpponent.name, matchMinute, matchPhase, recommendation, selectedCountry.name]);

  function phaseForMinute(minute) {
    if (minute <= 0) return "Pre-match";
    if (minute < 45) return "First half";
    if (minute === 45) return "Half-time";
    if (minute < 90) return "Second half";
    return "Full-time";
  }

  function addCommentary(line) {
    setCommentaryFeed((current) => [line, ...current].slice(0, 5));
  }

  function addMatchEvent(event) {
    setMatchEvents((current) => [event, ...current].slice(0, 8));
  }

  function addBroadcastLine(nextMinute = matchMinute) {
    const context = {
      agentName: agent?.name || "Your striker",
      country: selectedCountry.name,
      opponent: aiOpponent.name,
      direction: recommendation.direction,
      power: recommendation.power,
      risk: recommendation.risk,
      minute: Math.max(1, Math.min(nextMinute, 90)),
    };
    const nextPhase = phaseForMinute(context.minute);
    setMatchPhase(nextPhase);

    if (context.minute === 45) {
      playSound("halftime");
      addMatchEvent({ minute: 45, type: "half", label: "Half-time", text: "Half-time whistle. Agents regroup and Claude adjusts the next run." });
      addCommentary("45' Half-time. The squads go in, the AI Captain rewrites the attacking plan, and the market board is still moving.");
      return;
    }

    if (context.minute >= 90) {
      playSound("fulltime");
      return;
    }

    if (context.minute > 8 && context.minute % 3 === 0) {
      const incident = incidentTemplates[(context.minute + selectedCountry.id + aiOpponent.id + matchEvents.length) % incidentTemplates.length];
      const text = incident.text(context);
      setFormationMode(incident.impact);
      playSound(incident.tone);
      addMatchEvent({ minute: context.minute, type: incident.type, label: incident.label, text });
      lastCommentaryRef.current = text;
      addCommentary(text);
      return;
    }

    const pool = commentaryTemplates
      .map((template) => template(context))
      .filter((line) => line !== lastCommentaryRef.current);
    const indexSeed = (nextMinute + context.agentName.length + context.country.length + commentaryFeed.length) % pool.length;
    const line = pool[indexSeed] || commentaryTemplates[0](context);
    lastCommentaryRef.current = line;
    addCommentary(line);
  }

  function playSound(kind) {
    if (soundEnabled) playMatchSound(kind);
  }

  function startMatchSimulation(format, phase, openingLine) {
    setMatchMinute(1);
    setMatchFormat(format);
    setMatchPhase(phase);
    setMatchEvents([]);
    setFormationMode("balanced");
    playSound("whistle");
    addMatchEvent({ minute: 1, type: "kickoff", label: "Kick-off", text: openingLine });
    addCommentary(openingLine);
  }

  function evolveSquadAfterMatch(won) {
    if (!squad.length) {
      setFormationMode(won ? "attacking" : "defensive");
      return;
    }

    const primaryIndex = won ? 9 : 6;
    const secondaryIndex = won ? 10 : 2;
    const evolvedIndexes = [primaryIndex, secondaryIndex].filter((index) => squad[index]);
    const evolvedIds = evolvedIndexes.map((index) => squad[index].id || index + 1);
    setEvolvedPlayerIds(evolvedIds);
    setFormationMode(won ? "attacking" : "defensive");
    setSquad((current) =>
      current.map((player, index) => {
        if (!evolvedIndexes.includes(index)) return player;
        const baseRole = player.role?.replace("Evolved ", "") || "Forward";
        return {
          ...player,
          role: evolvedRoles[baseRole] || `Evolved ${baseRole}`,
          level: won ? (player.level === "Gold" ? "Gold" : "Silver") : player.level,
        };
      }),
    );
    addMatchEvent({
      minute: 90,
      type: "evolution",
      label: "Agent evolution",
      text: won
        ? `${squad[primaryIndex]?.name || "Your striker"} evolves after full-time and pushes the squad into an attacking shape.`
        : `${squad[secondaryIndex]?.name || "Your defender"} adapts after the loss and drops the squad into a defensive shape.`,
    });
  }

  useEffect(() => {
    if (!isMatchBusy) return undefined;
    const interval = window.setInterval(() => {
      setMatchMinute((current) => {
        if (current >= 90) return current;
        const jump = 5 + ((current + selectedCountry.id + aiOpponent.id) % 9);
        const rawNextMinute = Math.min(current + jump, 90);
        const nextMinute = current < 45 && rawNextMinute >= 45 ? 45 : rawNextMinute;
        addBroadcastLine(nextMinute);
        return nextMinute;
      });
    }, 2200);
    return () => window.clearInterval(interval);
  }, [aiOpponent.id, isMatchBusy, selectedCountry.id]);

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
    startMatchSimulation(
      "90-minute simulation",
      "First half",
      `1' Whistle goes. ${agent.name} leads ${selectedCountry.name} into a full match simulation against ${aiOpponent.name} AI.`,
    );
    setLastMatch({
      mode: "quick",
      phase: "Agents entering the pitch",
      home: selectedCountry.name,
      away: `${aiOpponent.name} AI`,
      scoreHome: undefined,
      scoreAway: undefined,
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
      playSound("kick");
      addCommentary("The shot is away. Now the chain settles the duel.");
      setLastMatch((current) => ({ ...current, phase: "Shot submitted on X Layer" }));
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const result = parseAgentMatchResult(receipt) || parseBattleResult(receipt);
      const won = result?.won ?? false;
      const displayScore =
        result?.scoreUser !== undefined ? result : fallbackScore(won, `${hash}:${agent.id}:${recommendation.power}:${Date.now()}`);
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
        phase: won ? "Full-time win" : "Full-time loss",
        home: selectedCountry.name,
        away: `${aiOpponent.name} AI`,
        scoreHome: displayScore.scoreUser,
        scoreAway: displayScore.scoreAgent,
        won,
      });
      setMatchMinute(90);
      setMatchPhase("Full-time");
      playSound(won ? "goal" : "save");
      window.setTimeout(() => playSound("fulltime"), 260);
      evolveSquadAfterMatch(won);
      addCommentary(
        won
          ? `90' Full-time. ${selectedCountry.name} take it ${displayScore.scoreUser}-${displayScore.scoreAgent}; the squad evolves into a more aggressive shape.`
          : `90' Full-time. ${aiOpponent.name} AI reads the match and takes it ${displayScore.scoreAgent}-${displayScore.scoreUser}; the squad adapts positions for the next run.`,
      );
      const scoreLine =
        displayScore.scoreUser !== undefined ? ` ${selectedCountry.name} ${displayScore.scoreUser}-${displayScore.scoreAgent} ${aiOpponent.name} AI.` : "";
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
    startMatchSimulation(
      "Open PvP challenge",
      "First half",
      `1' ${profile.name} opens a Challenge Player court. The first whistle is live while the arena waits for a rival wallet.`,
    );
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
    addCommentary(`Court Match #${matchId || "new"} is live. Share the ID and bring in the second wallet.`);
    setMessage(`Court match created. Share Match ID ${matchId || "from explorer"} with a second wallet. ${hash}`);
    setBusy("");
  }

  async function joinCourtMatch() {
    if (!canTransact || !agent?.id || !joinMatchId) return;
    setBusy("court-join");
    setMatchMinute(45);
    setMatchFormat("PvP challenge");
    setMatchPhase("Half-time");
    playSound("halftime");
    addMatchEvent({
      minute: 45,
      type: "half",
      label: "Half-time",
      text: `${profile.name} joins Court Match #${joinMatchId}. Both squads are locked in for the second half.`,
    });
    addCommentary(`45' Half-time restart. ${profile.name} joins Court Match #${joinMatchId}. Both squads are locked in.`);
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
    addCommentary(`Second wallet confirmed. Court Match #${joinMatchId} can now be settled.`);
    setMessage(`Second wallet joined Court Match #${joinMatchId}. Now either wallet can settle the autonomous agent battle. ${hash}`);
    setBusy("");
  }

  async function settleCourtMatch() {
    const matchId = courtMatchId || joinMatchId;
    if (!canTransact || !matchId) return;
    setBusy("court-settle");
    setMatchMinute(75);
    setMatchFormat("Final phase");
    setMatchPhase("Second half");
    playSound("kick");
    addMatchEvent({ minute: 75, type: "pressure", label: "Final phase", text: `Court Match #${matchId} is settling. The dots collapse into the box.` });
    addCommentary(`75' Court Match #${matchId} is settling. The dots collapse into the box.`);
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
        setMatchMinute(90);
        setMatchPhase("Full-time");
        playSound(userWon ? "goal" : "save");
        window.setTimeout(() => playSound("fulltime"), 260);
        evolveSquadAfterMatch(userWon);
        addCommentary(
          userWon
            ? `90' Full-time on-chain. Your squad wins ${result.scoreA}-${result.scoreB} and two agents evolve their positions.`
            : `90' Full-time on-chain. Rival wallet takes it ${result.scoreA}-${result.scoreB}; your squad reshapes for the rematch.`,
        );
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

  async function proposeExchangeOSMarket(questionOverride) {
    if (!canTransact || !hasPassport) return;
    setBusy("exchange-os");
    const matchId = courtMatchId || joinMatchId || "0";
    const question = questionOverride || `Will ${selectedCountry.name} FanDAO beat ${aiOpponent.name} in this autonomous match?`;
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
      args: [BigInt(matchId), selectedCountry.id, aiOpponent.id, question, strategyHash],
      chainId: xLayer.id,
    });
    setPendingHash(hash);
    await publicClient.waitForTransactionReceipt({ hash });
    setScores((current) =>
      current.map((country) =>
        country.id === selectedCountry.id ? { ...country, score: country.score + 18 } : country,
      ),
    );
    addMatchEvent({
      minute: Math.max(1, matchMinute || 1),
      type: "market",
      label: "Agent intent",
      text: `${agent?.name || "AI Captain"} posts a prediction intent: ${question}`,
    });
    addCommentary(`${Math.max(1, matchMinute || 1)}' Agent market desk: ${question}`);
    setMessage(`Exchange OS-ready market intent posted on X Layer: ${question}. ${hash}`);
    setBusy("");
  }

  async function postLiveMatchIntent() {
    if (!canTransact || !hasPassport) return;
    setBusy("live-intent");
    try {
      const question = `Will ${selectedFixture.home} beat ${selectedFixture.away} in ${selectedFixture.venue}?`;
      const intentHash = keccak256(
        encodePacked(
          ["string", "uint256"],
          [`${selectedFixture.id}:${question}:${agent?.name || "AI Captain"}:${recommendation.reason}`, BigInt(Date.now())],
        ),
      );
      const kickoff = Math.floor(new Date(selectedFixture.kickoff).getTime() / 1000);
      const hash = await writeContractAsync({
        address: contracts.StrikeNationArena,
        abi: arenaAbi,
        functionName: "postLiveMatchMarket",
        args: [selectedFixture.id, selectedFixture.home, selectedFixture.away, question, kickoff, intentHash],
        chainId: xLayer.id,
      });
      setPendingHash(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const marketId = parseLiveMarketId(receipt);
      if (marketId) setLiveMarketId(String(marketId));
      setMessage(`Live match market intent posted for ${selectedFixture.home} vs ${selectedFixture.away}. ${hash}`);
    } catch (error) {
      setMessage(error?.shortMessage || error?.message || "Live match intent was cancelled or failed.");
    } finally {
      setBusy("");
    }
  }

  async function stakeLiveMatch() {
    if (!canTransact || !liveMarketId) return;
    setBusy("live-stake");
    try {
      const amount = parseUnits(stakeAmount || "0", 6);
      if (amount <= 0n) {
        setMessage("Enter a USDT0 stake amount greater than zero.");
        setBusy("");
        return;
      }
      const approveHash = await writeContractAsync({
        address: contracts.USDT0,
        abi: erc20Abi,
        functionName: "approve",
        args: [contracts.StrikeNationArena, amount],
        chainId: xLayer.id,
      });
      setPendingHash(approveHash);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      const stakeHash = await writeContractAsync({
        address: contracts.StrikeNationArena,
        abi: arenaAbi,
        functionName: "stakeLiveMatch",
        args: [BigInt(liveMarketId), livePick, amount],
        chainId: xLayer.id,
      });
      setPendingHash(stakeHash);
      await publicClient.waitForTransactionReceipt({ hash: stakeHash });
      const pickLabel = livePick === 0 ? selectedFixture.home : livePick === 1 ? "Draw" : selectedFixture.away;
      setMessage(`Staked ${stakeAmount} USDT0 on ${pickLabel} for ${selectedFixture.home} vs ${selectedFixture.away}. ${stakeHash}`);
    } catch (error) {
      setMessage(error?.shortMessage || error?.message || "USDT0 stake was cancelled or failed.");
    } finally {
      setBusy("");
    }
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
          <a href="#live">Live</a>
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

        <section className="panel live-match-hub" id="live">
          <div className="section-head">
            <div>
              <span className="eyebrow">Live World Cup layer</span>
              <h2>Match Intent + USDT0 Stake</h2>
            </div>
            <button className="primary-btn small" disabled={!canTransact || !hasPassport || busy === "live-intent"} onClick={postLiveMatchIntent}>
              {busy === "live-intent" ? "Posting..." : "Post Live Intent"}
            </button>
          </div>

          <div className="live-grid">
            <div className="fixture-list">
              {liveFixtures.map((fixture) => (
                <button
                  type="button"
                  key={fixture.id}
                  className={`fixture-card ${selectedFixture.id === fixture.id ? "selected" : ""}`}
                  onClick={() => setSelectedFixture(fixture)}
                >
                  <span>{fixture.venue}</span>
                  <strong>
                    {fixture.home} vs {fixture.away}
                  </strong>
                  <small>{new Date(fixture.kickoff).toLocaleString()}</small>
                </button>
              ))}
            </div>

            <div className="live-market-card">
              <span className="eyebrow">Market intent</span>
              <h3>
                {selectedFixture.home} vs {selectedFixture.away}
              </h3>
              <p>
                AI Captain watches the real fixture, posts a verifiable outcome intent, then fans stake USDT0 on
                Home, Draw, or Away. Resolution can be handled by an oracle/operator when real World Cup data is live.
              </p>
              <div className="intent-line">
                <span>Fixture</span>
                <strong>{selectedFixture.id}</strong>
              </div>
              <div className="intent-line">
                <span>Focus</span>
                <strong>{selectedFixture.focus}</strong>
              </div>
              <label>
                Market ID
                <input value={liveMarketId} onChange={(event) => setLiveMarketId(event.target.value)} placeholder="Post intent or paste market ID" />
              </label>
            </div>

            <div className="stake-card">
              <span className="eyebrow">USDT0 prediction stake</span>
              <div className="pick-grid">
                {[selectedFixture.home, "Draw", selectedFixture.away].map((label, index) => (
                  <button
                    type="button"
                    key={label}
                    className={`pick-card ${livePick === index ? "selected" : ""}`}
                    onClick={() => setLivePick(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                Stake amount
                <input value={stakeAmount} onChange={(event) => setStakeAmount(event.target.value)} inputMode="decimal" />
              </label>
              <button className="primary-btn" disabled={!canTransact || !liveMarketId || busy === "live-stake"} onClick={stakeLiveMatch}>
                {busy === "live-stake" ? "Staking..." : "Approve + Stake USDT0"}
              </button>
              <p className="stake-note">
                Uses USDT0 on X Layer. This MVP locks stakes in the arena contract and supports pro-rata winner claims
                after market resolution.
              </p>
            </div>
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
                <div
                  className={`squad-player ${squad.length ? "minted" : ""} ${
                    evolvedPlayerIds.includes(player.id || index + 1) ? "evolved" : ""
                  }`}
                  key={`${player.name}-${index}`}
                >
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
                <span>{isMatchBusy ? `Live action / ${matchMinute}'` : lastMatch ? `Last result / ${matchMinute || 90}'` : "Ready"}</span>
                <strong>{isMatchBusy ? lastMatch?.phase || "Agents are moving" : lastMatch?.phase || "Choose a battle mode"}</strong>
              </div>
              <div className="match-clock">
                <strong>{matchMinute || 0}'</strong>
                <span>{matchPhase}</span>
                <small>{matchFormat}</small>
              </div>
              <div className={`formation-badge ${formationMode}`}>{formationMode} shape</div>
              <div className="goal goal-left">Goal</div>
              <div className="goal goal-right">Goal</div>
              <div className="center-circle"></div>
              <div className="shot-trail"></div>
              <div className="formation-layer" aria-hidden="true">
                {activeFormationDots.map((dot, index) => (
                  <span
                    key={`${dot.side}-${dot.role}-${index}`}
                    className={`player-dot ${dot.side}`}
                    style={{ left: `${dot.x}%`, top: `${dot.y}%`, "--delay": `${(index % 6) * 0.18}s` }}
                    title={dot.role}
                  >
                    <i></i>
                  </span>
                ))}
              </div>
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
              {!isMatchBusy && lastMatch?.scoreHome !== undefined && (
                <div className={`court-score ${lastMatch.won ? "won" : "lost"}`}>
                  <span>{lastMatch.home}</span>
                  <strong>
                    {lastMatch.scoreHome}-{lastMatch.scoreAway}
                  </strong>
                  <span>{lastMatch.away}</span>
                </div>
              )}
            </div>
            <div className="commentary-box">
              <div className="commentary-head">
                <div>
                  <span className="eyebrow">Live commentary</span>
                  <strong>{isMatchBusy ? "Broadcast is live" : "Match desk"}</strong>
                </div>
                <span className="match-length">Quick Battle: 90 in-game minutes compressed into the transaction</span>
                <button type="button" className="sound-toggle" onClick={() => setSoundEnabled((current) => !current)}>
                  {soundEnabled ? "Sound on" : "Sound off"}
                </button>
              </div>
              <div className="commentary-lines">
                {commentaryFeed.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
              <div className="event-timeline" aria-label="Match events">
                {matchEvents.length ? (
                  matchEvents.map((event, index) => (
                    <div className={`event-pill ${event.type}`} key={`${event.minute}-${event.type}-${index}`}>
                      <span>{event.minute}'</span>
                      <strong>{event.label}</strong>
                      <small>{event.text}</small>
                    </div>
                  ))
                ) : (
                  <div className="event-pill muted">
                    <span>0'</span>
                    <strong>Waiting for kick-off</strong>
                    <small>Start a Quick Battle or Challenge Player match to open the live event timeline.</small>
                  </div>
                )}
              </div>
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
              <p>Agent prediction intents</p>
              <div className="market-note">
                Once a match starts, Claude turns the live state into prediction intents. Your agent proposes the market,
                then your wallet approves the on-chain post for Exchange OS-ready routing.
              </div>
              <div className="agent-intent-grid">
                {agentMarketIdeas.map((idea) => (
                  <div className="agent-intent-card" key={idea.question}>
                    <span>{matchPhase}</span>
                    <strong>{idea.question}</strong>
                    <small>{idea.signal}</small>
                    <div>
                      <em>AI pick: {idea.pick}</em>
                      <button
                        className="secondary-btn"
                        disabled={!canTransact || !hasPassport || busy === "exchange-os"}
                        onClick={() => proposeExchangeOSMarket(idea.question)}
                      >
                        Post Intent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="market-actions">
                <button className="secondary-btn" disabled={!canTransact || !agent || busy === "prediction-YES"} onClick={() => placePrediction("YES")}>
                  Back YES
                </button>
                <button className="secondary-btn" disabled={!canTransact || !agent || busy === "prediction-NO"} onClick={() => placePrediction("NO")}>
                  Back NO
                </button>
                <button
                  className="primary-btn"
                  disabled={!canTransact || !hasPassport || busy === "exchange-os"}
                  onClick={() => proposeExchangeOSMarket()}
                >
                  {busy === "exchange-os" ? "Posting..." : "Post Main Intent"}
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
