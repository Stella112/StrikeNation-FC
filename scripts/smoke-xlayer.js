require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Contract, JsonRpcProvider, Wallet, id } = require("ethers");

const root = path.join(__dirname, "..");
const deployment = JSON.parse(fs.readFileSync(path.join(root, "deployments", "xlayer-mainnet.json"), "utf8"));
const passportArtifact = JSON.parse(fs.readFileSync(path.join(root, "artifacts", "FanPassportNFT.json"), "utf8"));
const agentArtifact = JSON.parse(fs.readFileSync(path.join(root, "artifacts", "StrikeAgentNFT.json"), "utf8"));
const arenaArtifact = JSON.parse(fs.readFileSync(path.join(root, "artifacts", "StrikeNationArena.json"), "utf8"));

async function main() {
  const provider = new JsonRpcProvider(process.env.XLAYER_RPC_URL || deployment.rpcUrl, 196);
  const signer = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const passport = new Contract(deployment.contracts.FanPassportNFT, passportArtifact.abi, signer);
  const agent = new Contract(deployment.contracts.StrikeAgentNFT, agentArtifact.abi, signer);
  const arena = new Contract(deployment.contracts.StrikeNationArena, arenaArtifact.abi, signer);

  console.log(`Testing as ${signer.address}`);

  let passportId = await passport.passportOf(signer.address);
  if (passportId === 0n) {
    const tx = await passport.mintPassport(1);
    const receipt = await tx.wait();
    console.log(`Passport minted: ${receipt.hash}`);
  } else {
    console.log(`Passport already minted: #${passportId.toString()}`);
  }

  const agentTx = await agent.createAgent("Naija Finisher", 1, "Calm Finisher", id("Naija Finisher:Calm Finisher:Nigeria"));
  const agentReceipt = await agentTx.wait();
  const created = agentReceipt.logs
    .map((log) => {
      try {
        return agent.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event) => event?.name === "StrikeAgentCreated");
  const agentId = Number(created.args.agentId);
  console.log(`Agent created #${agentId}: ${agentReceipt.hash}`);

  const predictionTx = await arena.placePrediction(1, 2, true);
  const predictionReceipt = await predictionTx.wait();
  console.log(`Prediction placed: ${predictionReceipt.hash}`);

  const battleTx = await arena.enterBattleAndSettle(agentId, 2, id(`left:78:${Date.now()}`), 78, true);
  const battleReceipt = await battleTx.wait();
  const result = battleReceipt.logs
    .map((log) => {
      try {
        return arena.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event) => event?.name === "InstantBattleResult");
  console.log(`Battle settled: ${battleReceipt.hash}`);
  console.log(`Won: ${result.args.won}, predictionCorrect: ${result.args.predictionCorrect}, points: ${result.args.points}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
