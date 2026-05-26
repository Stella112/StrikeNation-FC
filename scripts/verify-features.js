require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Contract, JsonRpcProvider, Wallet, id, parseEther } = require("ethers");

const root = path.join(__dirname, "..");
const deployment = JSON.parse(fs.readFileSync(path.join(root, "deployments", "xlayer-mainnet.json"), "utf8"));

function artifact(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
}

async function wait(label, tx) {
  const receipt = await tx.wait();
  console.log(`${label}: ${receipt.hash}`);
  return receipt;
}

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is missing");
  }

  const provider = new JsonRpcProvider(process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech", 196);
  const walletA = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const walletB = Wallet.createRandom().connect(provider);

  const passportAbi = artifact("FanPassportNFT").abi;
  const agentAbi = artifact("StrikeAgentNFT").abi;
  const arenaAbi = artifact("StrikeNationArena").abi;

  const passportA = new Contract(deployment.contracts.FanPassportNFT, passportAbi, walletA);
  const agentsA = new Contract(deployment.contracts.StrikeAgentNFT, agentAbi, walletA);
  const arenaA = new Contract(deployment.contracts.StrikeNationArena, arenaAbi, walletA);

  const startingBalance = await provider.getBalance(walletA.address);
  console.log(`Verifier A: ${walletA.address}`);
  console.log(`Verifier A balance: ${startingBalance.toString()} wei`);

  await wait("fund-temp-wallet", await walletA.sendTransaction({ to: walletB.address, value: parseEther("0.001") }));
  console.log(`Verifier B: ${walletB.address}`);

  await wait("mint-passport-A", await passportA.mintPassport(1));
  await wait("mint-squad-A", await agentsA.createSquad("Verify Eagles", 1, "Calm Finisher", id("verify-a-squad")));
  const squadA = await agentsA.squadOf(walletA.address);
  const agentA = squadA[9] || squadA[0];

  await wait("quick-battle-agent-mode", await arenaA.battleAgent(agentA, 2, id("verify-quick-battle"), 78, true));

  const matchReceipt = await wait("create-pvp-match", await arenaA.createCourtMatch(agentA, id("verify-pvp-a")));
  let matchId;
  for (const log of matchReceipt.logs) {
    try {
      const parsed = arenaA.interface.parseLog(log);
      if (parsed?.name === "CourtMatchCreated") matchId = parsed.args.matchId;
    } catch {
      // Ignore unrelated logs.
    }
  }
  if (!matchId) throw new Error("CourtMatchCreated event not found");

  const passportB = passportA.connect(walletB);
  const agentsB = agentsA.connect(walletB);
  const arenaB = arenaA.connect(walletB);

  await wait("mint-passport-B", await passportB.mintPassport(2));
  await wait("mint-squad-B", await agentsB.createSquad("Verify Canaries", 2, "High Risk Sniper", id("verify-b-squad")));
  const squadB = await agentsB.squadOf(walletB.address);
  const agentB = squadB[9] || squadB[0];

  await wait("join-pvp-match-B", await arenaB.joinCourtMatch(matchId, agentB, id("verify-pvp-b")));
  await wait("settle-pvp-match", await arenaA.settleCourtMatch(matchId));
  await wait("place-prediction", await arenaA.placePrediction(1, 2, true));
  await wait(
    "post-exchange-os-market-intent",
    await arenaA.proposeExchangeOSMarket(matchId, 1, 2, "Will Nigeria FanDAO beat Brazil in the next autonomous court?", id("verify-market")),
  );
  await wait(
    "post-live-match-market-intent",
    await arenaA.postLiveMatchMarket(
      "verify-wc26-nigeria-brazil",
      "Nigeria",
      "Brazil",
      "Will Nigeria beat Brazil in the verified live match hub?",
      Math.floor(Date.now() / 1000) + 86400,
      id("verify-live-market"),
    ),
  );

  const nigeriaPoints = await arenaA.countryPoints(1);
  const brazilPoints = await arenaA.countryPoints(2);
  console.log(`Nigeria points: ${nigeriaPoints.toString()}`);
  console.log(`Brazil points: ${brazilPoints.toString()}`);
  console.log("All on-chain feature checks completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
