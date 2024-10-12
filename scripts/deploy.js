const hre = require("hardhat");

async function main() {
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
