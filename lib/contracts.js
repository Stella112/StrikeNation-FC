export const xLayer = {
  id: 196,
  name: "X Layer",
  nativeCurrency: { decimals: 18, name: "OKB", symbol: "OKB" },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
    public: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer" },
  },
};

export const contracts = {
  FanPassportNFT: "0x339ad5eDFDefe246f286e052ED7B700F59E80d86",
  StrikeAgentNFT: "0xa89cD378fACA30c787dC1C96Ce2B34632650b46E",
  StrikeNationArena: "0xdfd726FF311a888347f1f90E7C18Fdcbf5F96B77",
  USDT0: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
};

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export const passportAbi = [
  {
    type: "function",
    name: "mintPassport",
    stateMutability: "nonpayable",
    inputs: [{ name: "country", type: "uint8" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "passportOf",
    stateMutability: "view",
    inputs: [{ name: "fan", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "countryOf",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
  },
];

export const agentAbi = [
  {
    type: "function",
    name: "createAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentName", type: "string" },
      { name: "country", type: "uint8" },
      { name: "playstyle", type: "string" },
      { name: "promptHash", type: "bytes32" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "createSquad",
    stateMutability: "nonpayable",
    inputs: [
      { name: "squadName", type: "string" },
      { name: "country", type: "uint8" },
      { name: "playstyle", type: "string" },
      { name: "promptHash", type: "bytes32" },
    ],
    outputs: [
      { name: "firstAgentId", type: "uint256" },
      { name: "lastAgentId", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "squadOf",
    stateMutability: "view",
    inputs: [{ name: "ownerAddress", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "hasMintedSquad",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "StrikeSquadMinted",
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "country", type: "uint8" },
      { indexed: false, name: "firstAgentId", type: "uint256" },
      { indexed: false, name: "lastAgentId", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "StrikeAgentCreated",
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: true, name: "country", type: "uint8" },
      { indexed: false, name: "name", type: "string" },
      { indexed: false, name: "playstyle", type: "string" },
      { indexed: false, name: "promptHash", type: "bytes32" },
    ],
  },
];

export const arenaAbi = [
  {
    type: "function",
    name: "createCourtMatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "strategyHash", type: "bytes32" },
    ],
    outputs: [{ name: "matchId", type: "uint256" }],
  },
  {
    type: "function",
    name: "joinCourtMatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "matchId", type: "uint256" },
      { name: "agentId", type: "uint256" },
      { name: "strategyHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "settleCourtMatch",
    stateMutability: "nonpayable",
    inputs: [{ name: "matchId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "enterBattleAndSettle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "opponentCountry", type: "uint8" },
      { name: "strategyHash", type: "bytes32" },
      { name: "power", type: "uint16" },
      { name: "backedCountry", type: "bool" },
    ],
    outputs: [
      { name: "battleId", type: "uint256" },
      { name: "won", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "battleAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "aiOpponentCountry", type: "uint8" },
      { name: "strategyHash", type: "bytes32" },
      { name: "power", type: "uint16" },
      { name: "backedCountry", type: "bool" },
    ],
    outputs: [
      { name: "battleId", type: "uint256" },
      { name: "won", type: "bool" },
      { name: "scoreUser", type: "uint8" },
      { name: "scoreAgent", type: "uint8" },
    ],
  },
  {
    type: "event",
    name: "CourtMatchCreated",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: true, name: "playerA", type: "address" },
      { indexed: true, name: "agentA", type: "uint256" },
      { indexed: false, name: "countryA", type: "uint8" },
      { indexed: false, name: "strategyA", type: "bytes32" },
    ],
  },
  {
    type: "event",
    name: "CourtMatchSettled",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "scoreA", type: "uint8" },
      { indexed: false, name: "scoreB", type: "uint8" },
      { indexed: false, name: "winnerPoints", type: "uint256" },
      { indexed: false, name: "loserPoints", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "placePrediction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "country", type: "uint8" },
      { name: "opponentCountry", type: "uint8" },
      { name: "backedCountry", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "proposeExchangeOSMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "courtMatchId", type: "uint256" },
      { name: "countryA", type: "uint8" },
      { name: "countryB", type: "uint8" },
      { name: "question", type: "string" },
      { name: "agentStrategyHash", type: "bytes32" },
    ],
    outputs: [{ name: "intentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "postLiveMatchMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fixtureId", type: "string" },
      { name: "homeTeam", type: "string" },
      { name: "awayTeam", type: "string" },
      { name: "question", type: "string" },
      { name: "kickoff", type: "uint64" },
      { name: "agentIntentHash", type: "bytes32" },
    ],
    outputs: [{ name: "marketId", type: "uint256" }],
  },
  {
    type: "function",
    name: "stakeLiveMatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "pick", type: "uint8" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimLiveMatch",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "event",
    name: "ExchangeOSMarketIntent",
    inputs: [
      { indexed: true, name: "intentId", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      { indexed: true, name: "courtMatchId", type: "uint256" },
      { indexed: false, name: "countryA", type: "uint8" },
      { indexed: false, name: "countryB", type: "uint8" },
      { indexed: false, name: "question", type: "string" },
      { indexed: false, name: "agentStrategyHash", type: "bytes32" },
    ],
  },
  {
    type: "event",
    name: "LiveMatchMarketPosted",
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "fixtureId", type: "string" },
      { indexed: false, name: "homeTeam", type: "string" },
      { indexed: false, name: "awayTeam", type: "string" },
      { indexed: false, name: "question", type: "string" },
      { indexed: false, name: "kickoff", type: "uint64" },
      { indexed: false, name: "agentIntentHash", type: "bytes32" },
    ],
  },
  {
    type: "event",
    name: "LiveMatchStakePlaced",
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "player", type: "address" },
      { indexed: true, name: "pick", type: "uint8" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "totalStaked", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "InstantBattleResult",
    inputs: [
      { indexed: true, name: "battleId", type: "uint256" },
      { indexed: false, name: "won", type: "bool" },
      { indexed: false, name: "predictionCorrect", type: "bool" },
      { indexed: false, name: "points", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "AgentMatchSettled",
    inputs: [
      { indexed: true, name: "battleId", type: "uint256" },
      { indexed: true, name: "player", type: "address" },
      { indexed: true, name: "opponentCountry", type: "uint8" },
      { indexed: false, name: "won", type: "bool" },
      { indexed: false, name: "scoreUser", type: "uint8" },
      { indexed: false, name: "scoreAgent", type: "uint8" },
      { indexed: false, name: "points", type: "uint256" },
    ],
  },
];

export const explorerTx = (hash) => `https://www.okx.com/web3/explorer/xlayer/tx/${hash}`;
export const explorerAddress = (address) => `https://www.okx.com/web3/explorer/xlayer/address/${address}`;
