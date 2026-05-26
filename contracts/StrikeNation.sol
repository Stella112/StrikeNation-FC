// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Ownable {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        require(nextOwner != address(0), "ZERO_OWNER");
        owner = nextOwner;
    }
}

contract SimpleERC721 is Ownable {
    string public name;
    string public symbol;
    string public baseURI;
    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory tokenName, string memory tokenSymbol) {
        name = tokenName;
        symbol = tokenSymbol;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "NOT_MINTED");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "ZERO_ACCOUNT");
        return _balances[account];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        return string.concat(baseURI, _toString(tokenId));
    }

    function setBaseURI(string calldata nextBaseURI) external onlyOwner {
        baseURI = nextBaseURI;
    }

    function approve(address spender, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "NOT_AUTHORIZED");
        getApproved[tokenId] = spender;
        emit Approval(tokenOwner, spender, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "NOT_AUTHORIZED");
        require(ownerOf(tokenId) == from, "WRONG_FROM");
        require(to != address(0), "ZERO_TO");

        delete getApproved[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        transferFrom(from, to, tokenId);
    }

    function _mint(address to) internal returns (uint256 tokenId) {
        require(to != address(0), "ZERO_TO");
        tokenId = ++totalSupply;
        _owners[tokenId] = to;
        _balances[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return spender == tokenOwner || getApproved[tokenId] == spender || isApprovedForAll[tokenOwner][spender];
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}

contract FanPassportNFT is SimpleERC721 {
    mapping(address => uint8) public countryOf;
    mapping(address => uint256) public passportOf;

    event FanPassportMinted(address indexed fan, uint256 indexed tokenId, uint8 indexed country);

    constructor() SimpleERC721("StrikeNation Fan Passport", "SNFP") {}

    function mintPassport(uint8 country) external returns (uint256 tokenId) {
        require(country > 0, "INVALID_COUNTRY");
        require(passportOf[msg.sender] == 0, "ALREADY_JOINED");
        tokenId = _mint(msg.sender);
        countryOf[msg.sender] = country;
        passportOf[msg.sender] = tokenId;
        emit FanPassportMinted(msg.sender, tokenId, country);
    }
}

contract StrikeAgentNFT is SimpleERC721 {
    uint8 public constant SQUAD_SIZE = 11;

    enum Level {
        Bronze,
        Silver,
        Gold
    }

    struct Agent {
        string name;
        uint8 country;
        string playstyle;
        bytes32 promptHash;
        Level level;
        uint32 wins;
        uint32 losses;
        uint32 predictionScore;
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) private _squadOf;
    mapping(address => bool) public hasMintedSquad;
    address public arena;

    event StrikeAgentCreated(
        address indexed owner,
        uint256 indexed agentId,
        uint8 indexed country,
        string name,
        string playstyle,
        bytes32 promptHash
    );
    event StrikeAgentUpdated(uint256 indexed agentId, Level level, uint32 wins, uint32 losses, uint32 predictionScore);
    event StrikeSquadMinted(address indexed owner, uint8 indexed country, uint256 firstAgentId, uint256 lastAgentId);

    modifier onlyArena() {
        require(msg.sender == arena, "NOT_ARENA");
        _;
    }

    constructor() SimpleERC721("StrikeNation Strike Agent", "SNSA") {}

    function setArena(address nextArena) external onlyOwner {
        require(nextArena != address(0), "ZERO_ARENA");
        arena = nextArena;
    }

    function createAgent(
        string calldata agentName,
        uint8 country,
        string calldata playstyle,
        bytes32 promptHash
    ) external returns (uint256 agentId) {
        require(bytes(agentName).length > 0, "EMPTY_NAME");
        require(country > 0, "INVALID_COUNTRY");
        agentId = _mint(msg.sender);
        agents[agentId] = Agent({
            name: agentName,
            country: country,
            playstyle: playstyle,
            promptHash: promptHash,
            level: Level.Bronze,
            wins: 0,
            losses: 0,
            predictionScore: 0
        });
        emit StrikeAgentCreated(msg.sender, agentId, country, agentName, playstyle, promptHash);
    }

    function createSquad(
        string calldata squadName,
        uint8 country,
        string calldata playstyle,
        bytes32 promptHash
    ) external returns (uint256 firstAgentId, uint256 lastAgentId) {
        require(bytes(squadName).length > 0, "EMPTY_NAME");
        require(country > 0, "INVALID_COUNTRY");
        require(!hasMintedSquad[msg.sender], "SQUAD_MINTED");

        hasMintedSquad[msg.sender] = true;

        for (uint8 index = 0; index < SQUAD_SIZE; index++) {
            uint256 agentId = _mint(msg.sender);
            if (index == 0) {
                firstAgentId = agentId;
            }
            lastAgentId = agentId;

            string memory role = _squadRole(index);
            string memory agentName = string.concat(squadName, " #", _toString(index + 1));
            string memory agentStyle = string.concat(playstyle, " / ", role);
            bytes32 agentPromptHash = keccak256(abi.encodePacked(promptHash, msg.sender, country, index));

            agents[agentId] = Agent({
                name: agentName,
                country: country,
                playstyle: agentStyle,
                promptHash: agentPromptHash,
                level: Level.Bronze,
                wins: 0,
                losses: 0,
                predictionScore: 0
            });
            _squadOf[msg.sender].push(agentId);
            emit StrikeAgentCreated(msg.sender, agentId, country, agentName, agentStyle, agentPromptHash);
        }

        emit StrikeSquadMinted(msg.sender, country, firstAgentId, lastAgentId);
    }

    function squadOf(address ownerAddress) external view returns (uint256[] memory) {
        return _squadOf[ownerAddress];
    }

    function recordBattle(uint256 agentId, bool won, bool predictionCorrect) external onlyArena {
        Agent storage agent = agents[agentId];
        require(bytes(agent.name).length > 0, "UNKNOWN_AGENT");

        if (won) {
            agent.wins += 1;
        } else {
            agent.losses += 1;
        }

        if (predictionCorrect) {
            agent.predictionScore += 1;
        }

        if (agent.wins >= 3 || agent.predictionScore >= 3) {
            agent.level = Level.Gold;
        } else if (agent.wins >= 1 || agent.predictionScore >= 1) {
            agent.level = Level.Silver;
        }

        emit StrikeAgentUpdated(agentId, agent.level, agent.wins, agent.losses, agent.predictionScore);
    }

    function _squadRole(uint8 index) private pure returns (string memory) {
        if (index == 0) return "Goalkeeper";
        if (index <= 4) return "Defender";
        if (index <= 7) return "Midfielder";
        return "Forward";
    }
}

contract StrikeNationArena is Ownable {
    FanPassportNFT public immutable passport;
    StrikeAgentNFT public immutable agents;
    IERC20 public immutable stakeToken;

    struct Battle {
        address player;
        uint256 agentId;
        uint8 country;
        uint8 opponentCountry;
        bytes32 strategyHash;
        uint16 power;
        bool settled;
        bool won;
    }

    struct CourtMatch {
        address playerA;
        address playerB;
        uint256 agentA;
        uint256 agentB;
        uint8 countryA;
        uint8 countryB;
        bytes32 strategyA;
        bytes32 strategyB;
        bool settled;
        uint8 scoreA;
        uint8 scoreB;
        address winner;
    }

    struct MarketIntent {
        address proposer;
        uint256 courtMatchId;
        uint8 countryA;
        uint8 countryB;
        string question;
        bytes32 agentStrategyHash;
        uint256 createdAt;
    }

    struct LiveMatchMarket {
        address creator;
        string fixtureId;
        string homeTeam;
        string awayTeam;
        string question;
        uint64 kickoff;
        uint8 status;
        uint8 result;
        bytes32 agentIntentHash;
        uint256 totalStaked;
    }

    uint256 public battleCount;
    uint256 public courtMatchCount;
    uint256 public marketIntentCount;
    uint256 public liveMarketCount;
    mapping(uint256 => Battle) public battles;
    mapping(uint256 => CourtMatch) public courtMatches;
    mapping(uint256 => MarketIntent) public marketIntents;
    mapping(uint256 => LiveMatchMarket) public liveMarkets;
    mapping(uint256 => uint256[3]) public liveMarketTotals;
    mapping(uint256 => mapping(address => uint256[3])) public liveMarketStakes;
    mapping(uint8 => uint256) public countryPoints;
    mapping(address => uint256) public pendingRewards;

    event BattleEntered(
        uint256 indexed battleId,
        address indexed player,
        uint256 indexed agentId,
        uint8 country,
        uint8 opponentCountry,
        bytes32 strategyHash,
        uint16 power
    );
    event BattleSettled(uint256 indexed battleId, bool won, uint256 points, uint256 rewardWei);
    event InstantBattleResult(uint256 indexed battleId, bool won, bool predictionCorrect, uint256 points);
    event AgentMatchSettled(
        uint256 indexed battleId,
        address indexed player,
        uint8 indexed opponentCountry,
        bool won,
        uint8 scoreUser,
        uint8 scoreAgent,
        uint256 points
    );
    event CourtMatchCreated(
        uint256 indexed matchId,
        address indexed playerA,
        uint256 indexed agentA,
        uint8 countryA,
        bytes32 strategyA
    );
    event CourtMatchJoined(
        uint256 indexed matchId,
        address indexed playerB,
        uint256 indexed agentB,
        uint8 countryB,
        bytes32 strategyB
    );
    event CourtMatchSettled(
        uint256 indexed matchId,
        address indexed winner,
        uint8 scoreA,
        uint8 scoreB,
        uint256 winnerPoints,
        uint256 loserPoints
    );
    event ExchangeOSMarketIntent(
        uint256 indexed intentId,
        address indexed proposer,
        uint256 indexed courtMatchId,
        uint8 countryA,
        uint8 countryB,
        string question,
        bytes32 agentStrategyHash
    );
    event LiveMatchMarketPosted(
        uint256 indexed marketId,
        address indexed creator,
        string fixtureId,
        string homeTeam,
        string awayTeam,
        string question,
        uint64 kickoff,
        bytes32 agentIntentHash
    );
    event LiveMatchStakePlaced(
        uint256 indexed marketId,
        address indexed player,
        uint8 indexed pick,
        uint256 amount,
        uint256 totalStaked
    );
    event LiveMatchResolved(uint256 indexed marketId, uint8 indexed result);
    event LiveMatchClaimed(uint256 indexed marketId, address indexed player, uint256 payout);
    event PredictionPlaced(address indexed player, uint8 indexed country, uint8 opponentCountry, bool backedCountry);
    event RewardClaimed(address indexed player, uint256 amountWei);

    constructor(address passportAddress, address agentAddress, address stakeTokenAddress) {
        passport = FanPassportNFT(passportAddress);
        agents = StrikeAgentNFT(agentAddress);
        stakeToken = IERC20(stakeTokenAddress);
    }

    receive() external payable {}

    function enterBattle(
        uint256 agentId,
        uint8 opponentCountry,
        bytes32 strategyHash,
        uint16 power
    ) public returns (uint256 battleId) {
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(agents.ownerOf(agentId) == msg.sender, "NOT_AGENT_OWNER");
        require(opponentCountry > 0, "INVALID_OPPONENT");
        require(power <= 100, "INVALID_POWER");

        (, uint8 country, , , , , , ) = agents.agents(agentId);
        require(country == passport.countryOf(msg.sender), "COUNTRY_MISMATCH");

        battleId = ++battleCount;
        battles[battleId] = Battle({
            player: msg.sender,
            agentId: agentId,
            country: country,
            opponentCountry: opponentCountry,
            strategyHash: strategyHash,
            power: power,
            settled: false,
            won: false
        });

        emit BattleEntered(battleId, msg.sender, agentId, country, opponentCountry, strategyHash, power);
    }

    function createCourtMatch(uint256 agentId, bytes32 strategyHash) external returns (uint256 matchId) {
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(agents.ownerOf(agentId) == msg.sender, "NOT_AGENT_OWNER");

        (, uint8 country, , , , , , ) = agents.agents(agentId);
        require(country == passport.countryOf(msg.sender), "COUNTRY_MISMATCH");

        matchId = ++courtMatchCount;
        courtMatches[matchId] = CourtMatch({
            playerA: msg.sender,
            playerB: address(0),
            agentA: agentId,
            agentB: 0,
            countryA: country,
            countryB: 0,
            strategyA: strategyHash,
            strategyB: bytes32(0),
            settled: false,
            scoreA: 0,
            scoreB: 0,
            winner: address(0)
        });

        emit CourtMatchCreated(matchId, msg.sender, agentId, country, strategyHash);
    }

    function joinCourtMatch(uint256 matchId, uint256 agentId, bytes32 strategyHash) external {
        CourtMatch storage courtMatch = courtMatches[matchId];
        require(courtMatch.playerA != address(0), "UNKNOWN_MATCH");
        require(courtMatch.playerB == address(0), "MATCH_FULL");
        require(courtMatch.playerA != msg.sender, "CANNOT_PLAY_SELF");
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(agents.ownerOf(agentId) == msg.sender, "NOT_AGENT_OWNER");

        (, uint8 country, , , , , , ) = agents.agents(agentId);
        require(country == passport.countryOf(msg.sender), "COUNTRY_MISMATCH");

        courtMatch.playerB = msg.sender;
        courtMatch.agentB = agentId;
        courtMatch.countryB = country;
        courtMatch.strategyB = strategyHash;

        emit CourtMatchJoined(matchId, msg.sender, agentId, country, strategyHash);
    }

    function settleCourtMatch(uint256 matchId) external {
        CourtMatch storage courtMatch = courtMatches[matchId];
        require(courtMatch.playerA != address(0), "UNKNOWN_MATCH");
        require(courtMatch.playerB != address(0), "WAITING_FOR_PLAYER");
        require(!courtMatch.settled, "SETTLED");

        uint8 scoreA = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        block.timestamp,
                        courtMatch.playerA,
                        courtMatch.agentA,
                        courtMatch.strategyA,
                        matchId
                    )
                )
            ) % 6
        );
        uint8 scoreB = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        courtMatch.playerB,
                        courtMatch.agentB,
                        courtMatch.strategyB,
                        matchId
                    )
                )
            ) % 6
        );

        if (scoreA == scoreB) {
            if (scoreA < 5) {
                scoreA += 1;
            } else {
                scoreB -= 1;
            }
        }

        bool playerAWon = scoreA > scoreB;
        address winner = playerAWon ? courtMatch.playerA : courtMatch.playerB;
        uint256 winnerPoints = 180;
        uint256 loserPoints = 70;

        courtMatch.settled = true;
        courtMatch.scoreA = scoreA;
        courtMatch.scoreB = scoreB;
        courtMatch.winner = winner;

        countryPoints[courtMatch.countryA] += playerAWon ? winnerPoints : loserPoints;
        countryPoints[courtMatch.countryB] += playerAWon ? loserPoints : winnerPoints;

        agents.recordBattle(courtMatch.agentA, playerAWon, false);
        agents.recordBattle(courtMatch.agentB, !playerAWon, false);

        emit CourtMatchSettled(matchId, winner, scoreA, scoreB, winnerPoints, loserPoints);
    }

    function proposeExchangeOSMarket(
        uint256 courtMatchId,
        uint8 countryA,
        uint8 countryB,
        string calldata question,
        bytes32 agentStrategyHash
    ) external returns (uint256 intentId) {
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(countryA > 0 && countryB > 0, "INVALID_COUNTRIES");
        require(bytes(question).length > 0, "EMPTY_QUESTION");

        if (courtMatchId != 0) {
            require(courtMatches[courtMatchId].playerA != address(0), "UNKNOWN_MATCH");
        }

        intentId = ++marketIntentCount;
        marketIntents[intentId] = MarketIntent({
            proposer: msg.sender,
            courtMatchId: courtMatchId,
            countryA: countryA,
            countryB: countryB,
            question: question,
            agentStrategyHash: agentStrategyHash,
            createdAt: block.timestamp
        });

        countryPoints[countryA] += 18;
        emit ExchangeOSMarketIntent(intentId, msg.sender, courtMatchId, countryA, countryB, question, agentStrategyHash);
    }

    function postLiveMatchMarket(
        string calldata fixtureId,
        string calldata homeTeam,
        string calldata awayTeam,
        string calldata question,
        uint64 kickoff,
        bytes32 agentIntentHash
    ) external returns (uint256 marketId) {
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(bytes(fixtureId).length > 0, "EMPTY_FIXTURE");
        require(bytes(homeTeam).length > 0 && bytes(awayTeam).length > 0, "EMPTY_TEAMS");
        require(bytes(question).length > 0, "EMPTY_QUESTION");

        marketId = ++liveMarketCount;
        liveMarkets[marketId] = LiveMatchMarket({
            creator: msg.sender,
            fixtureId: fixtureId,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            question: question,
            kickoff: kickoff,
            status: 0,
            result: 3,
            agentIntentHash: agentIntentHash,
            totalStaked: 0
        });

        countryPoints[passport.countryOf(msg.sender)] += 22;
        emit LiveMatchMarketPosted(marketId, msg.sender, fixtureId, homeTeam, awayTeam, question, kickoff, agentIntentHash);
    }

    function stakeLiveMatch(uint256 marketId, uint8 pick, uint256 amount) external {
        LiveMatchMarket storage market = liveMarkets[marketId];
        require(market.creator != address(0), "UNKNOWN_MARKET");
        require(market.status == 0, "MARKET_CLOSED");
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(pick < 3, "INVALID_PICK");
        require(amount > 0, "ZERO_AMOUNT");

        require(stakeToken.transferFrom(msg.sender, address(this), amount), "TRANSFER_FAILED");

        liveMarketStakes[marketId][msg.sender][pick] += amount;
        liveMarketTotals[marketId][pick] += amount;
        market.totalStaked += amount;
        countryPoints[passport.countryOf(msg.sender)] += 20;

        emit LiveMatchStakePlaced(marketId, msg.sender, pick, amount, market.totalStaked);
    }

    function resolveLiveMatch(uint256 marketId, uint8 result) external onlyOwner {
        LiveMatchMarket storage market = liveMarkets[marketId];
        require(market.creator != address(0), "UNKNOWN_MARKET");
        require(market.status == 0, "ALREADY_RESOLVED");
        require(result < 3, "INVALID_RESULT");

        market.status = 1;
        market.result = result;

        emit LiveMatchResolved(marketId, result);
    }

    function claimLiveMatch(uint256 marketId) external {
        LiveMatchMarket storage market = liveMarkets[marketId];
        require(market.status == 1, "NOT_RESOLVED");

        uint8 result = market.result;
        uint256 winningStake = liveMarketStakes[marketId][msg.sender][result];
        require(winningStake > 0, "NO_WINNING_STAKE");

        uint256 winningPool = liveMarketTotals[marketId][result];
        require(winningPool > 0, "NO_WINNING_POOL");

        uint256 payout = (winningStake * market.totalStaked) / winningPool;
        liveMarketStakes[marketId][msg.sender][result] = 0;

        require(stakeToken.transfer(msg.sender, payout), "PAYOUT_FAILED");
        emit LiveMatchClaimed(marketId, msg.sender, payout);
    }

    function enterBattleAndSettle(
        uint256 agentId,
        uint8 opponentCountry,
        bytes32 strategyHash,
        uint16 power,
        bool backedCountry
    ) external returns (uint256 battleId, bool won) {
        battleId = enterBattle(agentId, opponentCountry, strategyHash, power);
        (won, , , , ) = _settleAgentBattle(battleId, backedCountry);
    }

    function battleAgent(
        uint256 agentId,
        uint8 aiOpponentCountry,
        bytes32 strategyHash,
        uint16 power,
        bool backedCountry
    ) external returns (uint256 battleId, bool won, uint8 scoreUser, uint8 scoreAgent) {
        battleId = enterBattle(agentId, aiOpponentCountry, strategyHash, power);
        uint256 points;
        (won, scoreUser, scoreAgent, points, ) = _settleAgentBattle(battleId, backedCountry);

        emit AgentMatchSettled(battleId, msg.sender, aiOpponentCountry, won, scoreUser, scoreAgent, points);
    }

    function _settleAgentBattle(
        uint256 battleId,
        bool backedCountry
    ) internal returns (bool won, uint8 scoreUser, uint8 scoreAgent, uint256 points, bool predictionCorrect) {
        Battle storage battle = battles[battleId];
        require(battle.player != address(0), "UNKNOWN_BATTLE");
        require(!battle.settled, "SETTLED");

        uint256 roll = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    battle.player,
                    battle.agentId,
                    battle.strategyHash,
                    battle.opponentCountry,
                    battleId
                )
            )
        );

        scoreUser = uint8(roll % 4);
        if (battle.power >= 70) {
            scoreUser += 1;
        }
        if (battle.power >= 88 && ((roll >> 16) % 3 == 0)) {
            scoreUser += 1;
        }
        if (scoreUser > 5) {
            scoreUser = 5;
        }

        scoreAgent = uint8((roll >> 40) % 5);
        if (((roll >> 72) % 100) > battle.power) {
            scoreAgent += 1;
        }
        if (scoreAgent > 5) {
            scoreAgent = 5;
        }

        if (scoreUser == scoreAgent) {
            if (((roll >> 104) % 100) + battle.power >= 108) {
                if (scoreUser < 5) {
                    scoreUser += 1;
                }
            } else if (scoreAgent < 5) {
                scoreAgent += 1;
            } else {
                scoreUser -= 1;
            }
        }

        won = scoreUser > scoreAgent;
        predictionCorrect = backedCountry == won;
        points = won ? 145 : 55;

        if (predictionCorrect) {
            points += 42;
        }

        battle.settled = true;
        battle.won = won;
        countryPoints[battle.country] += points;
        agents.recordBattle(battle.agentId, won, predictionCorrect);

        emit BattleSettled(battleId, won, points, 0);
        emit InstantBattleResult(battleId, won, predictionCorrect, points);
    }

    function placePrediction(uint8 country, uint8 opponentCountry, bool backedCountry) external {
        require(passport.passportOf(msg.sender) != 0, "NO_PASSPORT");
        require(country > 0 && opponentCountry > 0, "INVALID_MARKET");
        countryPoints[country] += 12;
        emit PredictionPlaced(msg.sender, country, opponentCountry, backedCountry);
    }

    function settleBattle(uint256 battleId, bool won, bool predictionCorrect, uint256 rewardWei) external onlyOwner {
        Battle storage battle = battles[battleId];
        require(battle.player != address(0), "UNKNOWN_BATTLE");
        require(!battle.settled, "SETTLED");

        battle.settled = true;
        battle.won = won;

        uint256 points = won ? 145 : 55;
        if (predictionCorrect) {
            points += 42;
        }

        countryPoints[battle.country] += points;
        agents.recordBattle(battle.agentId, won, predictionCorrect);

        if (rewardWei > 0) {
            require(address(this).balance >= rewardWei, "INSUFFICIENT_REWARD_POOL");
            pendingRewards[battle.player] += rewardWei;
        }

        emit BattleSettled(battleId, won, points, rewardWei);
    }

    function claimRewards() external {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "NO_REWARD");
        pendingRewards[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "TRANSFER_FAILED");
        emit RewardClaimed(msg.sender, amount);
    }
}
