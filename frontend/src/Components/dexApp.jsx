import React, { useState, useEffect } from "react";
import { ethers, toBigInt } from "ethers";
import contractData from "../contractData.json";
import detectEthereumProvider from "@metamask/detect-provider";

const DEX_ABI = contractData?.dex?.abi;
const KAIZEN_ABI = contractData?.kaizenToken?.abi;
const HIKARI_ABI = contractData?.hikariToken?.abi;

const DEX_ADDRESS = contractData?.dex?.address;
const KAIZEN_ADDRESS = contractData?.kaizenToken?.address;
const HIKARI_ADDRESS = contractData?.hikariToken?.address;

const DexApp = () => {
  const [dexContract, setDexContract] = useState(null);
  const [kaizenContract, setKaizenContract] = useState(null);
  const [hikariContract, setHikariContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [kaizenBalance, setKaizenBalance] = useState("0");
  const [hikariBalance, setHikariBalance] = useState("0");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState("KaizenToHikari");
  const [liquidityAmount1, setLiquidityAmount1] = useState("");
  const [liquidityAmount2, setLiquidityAmount2] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        try {
          const ethersProvider = new ethers.BrowserProvider(provider);
          const signer = await ethersProvider?.getSigner();
          const accounts = await provider?.request({ method: "eth_accounts" });
          if (accounts?.length > 0) {
            setUserAddress(accounts[0]);
          }

          const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
          const kaizen = new ethers.Contract(
            KAIZEN_ADDRESS,
            KAIZEN_ABI,
            signer
          );
          const hikari = new ethers.Contract(
            HIKARI_ADDRESS,
            HIKARI_ABI,
            signer
          );

          setDexContract(dex);
          setKaizenContract(kaizen);
          setHikariContract(hikari);

          const kaizenBal = await kaizen?.balanceOf(accounts[0]);
          const hikariBal = await hikari?.balanceOf(accounts[0]);
          setKaizenBalance(ethers.formatEther(kaizenBal));
          setHikariBalance(ethers.formatEther(hikariBal));
        } catch (error) {
          console.error("An error occurred during initialization:", error);
          setErrorMessage(
            "Failed to connect to the Ethereum network. Please make sure you have MetaMask installed and connected."
          );
        }
      } else {
        setErrorMessage("Please install MetaMask to use this dApp");
      }
    };

    init();
  }, []);

  const handleSwap = async () => {
    try {
      const amountIn = ethers.parseEther(swapAmount);
      const tokenIn =
        swapDirection === "KaizenToHikari" ? KAIZEN_ADDRESS : HIKARI_ADDRESS;
      const tokenOut =
        swapDirection === "KaizenToHikari" ? HIKARI_ADDRESS : KAIZEN_ADDRESS;

      try {
        const tokenContract =
          swapDirection === "KaizenToHikari" ? kaizenContract : hikariContract;

        const balance = await tokenContract.balanceOf(userAddress);

        const balanceBigInt = toBigInt(balance.toString());
        const amountInBigInt = toBigInt(amountIn.toString());

        if (balanceBigInt < amountInBigInt) {
          throw new Error("Insufficient balance for approval");
        }

        const tx = await tokenContract.approve(DEX_ADDRESS, amountIn);
        await tx.wait();
      } catch (error) {
        console.error("Error during token approval:", error);
        setErrorMessage(`Approval failed`);
        return;
      }

      const tx = await dexContract.swap(amountIn, tokenIn, tokenOut);
      await tx.wait();

      const kaizenBal = await kaizenContract.balanceOf(userAddress);
      const hikariBal = await hikariContract.balanceOf(userAddress);

      setKaizenBalance(ethers.formatEther(kaizenBal));
      setHikariBalance(ethers.formatEther(hikariBal));

      setSwapAmount("");
      setErrorMessage("");
    } catch (error) {
      console.error("An error occurred during the swap:", error);
      setErrorMessage("Swap failed. Please check your balance and try again.");
    }
  };

  const handleAddLiquidity = async () => {
    try {
      const amount1 = ethers.parseEther(liquidityAmount1);
      const amount2 = ethers.parseEther(liquidityAmount2);

      await kaizenContract.approve(DEX_ADDRESS, amount1);
      await hikariContract.approve(DEX_ADDRESS, amount2);

      const tx = await dexContract.addLiquidity(amount1, amount2);
      await tx.wait();

      const kaizenBal = await kaizenContract.balanceOf(userAddress);
      const hikariBal = await hikariContract.balanceOf(userAddress);
      setKaizenBalance(ethers.formatEther(kaizenBal));
      setHikariBalance(ethers.formatEther(hikariBal));

      setLiquidityAmount1("");
      setLiquidityAmount2("");
      setErrorMessage("");
    } catch (error) {
      console.error("An error occurred while adding liquidity:", error);
      setErrorMessage(
        "Failed to add liquidity. Please check your balance and try again."
      );
    }
  };

  return (
    <div className=" bg-custom-color max-w-xl mx-auto p-4 font-sans flex items-center justify-center min-h-screen">
      <div className="bg-contentBox rounded-lg shadow-md overflow-hidden">
        <div className="bg-header-color text-custom-color p-5">
          <h2 className="text-2xl font-bold">RyuSwap</h2>
        </div>
        <div className="p-5">
          <div className="mb-5 text-white">
            <p>Connected Address: {userAddress}</p>
            <p>Kaizen Balance: {parseFloat(kaizenBalance).toFixed(2)} KZN</p>
            <p>Hikari Balance: {parseFloat(hikariBalance).toFixed(2)} HKR</p>
          </div>

          <div className="mb-5">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Swap Tokens
            </h3>
            <input
              type="number"
              value={swapAmount}
              text-white
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="Amount to swap"
              className="w-full p-2 mb-2 border rounded"
            />
            <select
              value={swapDirection}
              onChange={(e) => setSwapDirection(e.target.value)}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="KaizenToHikari">Kaizen to Hikari</option>
              <option value="HikariToKaizen">Hikari to Kaizen</option>
            </select>
            <button
              onClick={handleSwap}
              className="w-full p-2 bg-button-color text-white rounded hover:bg-button-hover"
            >
              Swap
            </button>
          </div>

          <div className="mb-5">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Add Liquidity
            </h3>
            <input
              type="number"
              value={liquidityAmount1}
              onChange={(e) => setLiquidityAmount1(e.target.value)}
              placeholder="Amount of Kaizen"
              className="w-full p-2 mb-2 border rounded"
            />
            <input
              type="number"
              value={liquidityAmount2}
              onChange={(e) => setLiquidityAmount2(e.target.value)}
              placeholder="Amount of Hikari"
              className="w-full p-2 mb-2 border rounded"
            />
            <button
              onClick={handleAddLiquidity}
              className="w-full p-2 bg-button-color text-white rounded hover:bg-button-hover"
            >
              Add Liquidity
            </button>
          </div>

          {errorMessage && (
            <div className="bg-red-500 text-white p-3 rounded">
              <h4 className="font-bold">Error</h4>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DexApp;
