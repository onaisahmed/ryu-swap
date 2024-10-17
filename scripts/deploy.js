const hre = require("hardhat");
const fs = require("fs");

async function main() {
  await resetNetwork();
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const kaizen = await hre.ethers.getContractFactory("Kaizen");
  const kaizenToken = await kaizen.deploy(hre.ethers.parseEther("1000000"));
  await kaizenToken.waitForDeployment();
  const kaizenTokenAddress = await kaizenToken.getAddress();

  const hikari = await hre.ethers.getContractFactory("Hikari");
  const hikariToken = await hikari.deploy(hre.ethers.parseEther("1000000"));
  await hikariToken.waitForDeployment();
  const hikariTokenAddress = await hikariToken.getAddress();

  const DEX = await hre.ethers.getContractFactory("DEX");
  const dex = await DEX.deploy(kaizenTokenAddress, hikariTokenAddress);
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();

  console.log("Kaizen deployed to:", kaizenTokenAddress);
  console.log("Hikari deployed to:", hikariTokenAddress);
  console.log("DEX deployed to:", dexAddress);

  const kaizenABI = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Kaizen.sol/Kaizen.json", "utf8")
  ).abi;
  const hikariABI = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Hikari.sol/Hikari.json", "utf8")
  ).abi;
  const dexABI = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/decentralized-exchange.sol/DEX.json",
      "utf8"
    )
  ).abi;

  // Create contractData.json
  const contractData = {
    kaizenToken: {
      address: kaizenTokenAddress,
      abi: kaizenABI,
    },
    hikariToken: {
      address: hikariTokenAddress,
      abi: hikariABI,
    },
    dex: {
      address: dexAddress,
      abi: dexABI,
    },
  };

  // Write contractData to file
  fs.writeFileSync(
    "./frontend/src/contractData.json",
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data written to ./frontend/src/contractData.json");
}

async function resetNetwork() {
  await network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
