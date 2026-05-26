require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { ContractFactory, JsonRpcProvider, Wallet } = require("ethers");

const root = path.join(__dirname, "..");
const rpcUrl = process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const stakeTokenAddress = process.env.USDT0_ADDRESS || "0x779Ded0c9e1022225f8E0630b35a9b54bE713736";

if (!privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY is missing. Create .env.local or set the environment variable.");
}

function artifact(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
}

async function deploy(name, signer, args = []) {
  const compiled = artifact(name);
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${name}: ${address}`);
  return { contract, address };
}

async function main() {
  const provider = new JsonRpcProvider(rpcUrl, 196);
  const signer = new Wallet(privateKey, provider);
  const balance = await provider.getBalance(signer.address);
  console.log(`Deploying from ${signer.address}`);
  console.log(`Balance: ${balance.toString()} wei`);

  const passport = await deploy("FanPassportNFT", signer);
  const agents = await deploy("StrikeAgentNFT", signer);
  const arena = await deploy("StrikeNationArena", signer, [passport.address, agents.address, stakeTokenAddress]);

  const setArenaTx = await agents.contract.setArena(arena.address);
  await setArenaTx.wait();
  console.log("StrikeAgentNFT arena set");

  const deployment = {
    network: "xlayer-mainnet",
    chainId: 196,
    rpcUrl,
    deployer: signer.address,
    contracts: {
      FanPassportNFT: passport.address,
      StrikeAgentNFT: agents.address,
      StrikeNationArena: arena.address,
      USDT0: stakeTokenAddress,
    },
    explorerBase: "https://www.okx.com/web3/explorer/xlayer/address",
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(root, "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(path.join(deploymentsDir, "xlayer-mainnet.json"), JSON.stringify(deployment, null, 2));
  fs.writeFileSync(
    path.join(root, "contract-config.js"),
    `window.STRIKENATION_CONTRACTS = ${JSON.stringify(deployment, null, 2)};\n`,
  );
  console.log("Deployment config written.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
