const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let DEX, Kaizen, Hikari;
  let dex, kaizen, hikari;
  let kaizenTokenAddress, hikariTokenAddress, dexAddress;
  let owner, user1, user2;
  let initialSupply, swapAmount;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    initialSupply = ethers.parseEther("1000");
    swapAmount = ethers.parseEther("100");

    Kaizen = await ethers.getContractFactory("Kaizen");
    kaizen = await Kaizen.deploy(initialSupply);
    await kaizen.waitForDeployment();
    kaizenTokenAddress = await kaizen.getAddress();

    Hikari = await ethers.getContractFactory("Hikari");
    hikari = await Hikari.deploy(initialSupply);
    await hikari.waitForDeployment();
    hikariTokenAddress = await hikari.getAddress();

    DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(kaizenTokenAddress, hikariTokenAddress);
    await dex.waitForDeployment();
    dexAddress = await dex.getAddress();

    await kaizen.transfer(dexAddress, ethers.parseEther("900"));
    await hikari.transfer(dexAddress, ethers.parseEther("900"));
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await dex.token1()).to.equal(kaizenTokenAddress);
      expect(await dex.token2()).to.equal(hikariTokenAddress);
    });
  });

  describe("Liquidity", function () {
    it("Should add liquidity correctly", async function () {
      const dexKaizenBalance = await kaizen.balanceOf(dexAddress);
      const dexHikariBalance = await hikari.balanceOf(dexAddress);
      expect(dexKaizenBalance).to.equal(ethers.parseEther("900"));
      expect(dexHikariBalance).to.equal(ethers.parseEther("900"));
    });
  });

  describe("Swapping", function () {
    beforeEach(async function () {
      await kaizen.transfer(user1.address, swapAmount);
      await kaizen.connect(user1).approve(dexAddress, swapAmount);
    });

    it("Should swap tokens correctly", async function () {
      const user1KaizenBalanceBefore = await kaizen.balanceOf(user1.address);
      const user1HikariBalanceBefore = await hikari.balanceOf(user1.address);

      await dex
        .connect(user1)
        .swap(swapAmount, kaizenTokenAddress, hikariTokenAddress);

      const user1KaizenBalanceAfter = await kaizen.balanceOf(user1.address);
      const user1HikariBalanceAfter = await hikari.balanceOf(user1.address);

      expect(user1KaizenBalanceAfter).to.be.lt(user1KaizenBalanceBefore);
      expect(user1HikariBalanceAfter).to.be.gt(user1HikariBalanceBefore);
    });

    it("Should emit a Swap event on successful swap", async function () {
      const amountIn = ethers.parseEther("10");

      await kaizen.connect(user1).approve(dexAddress, amountIn);

      await expect(
        dex
          .connect(user1)
          .swap(amountIn, kaizenTokenAddress, hikariTokenAddress)
      ).to.emit(dex, "Swap");
    });

    it("Should revert when swapping invalid tokens", async function () {
      await expect(
        dex.connect(user1).swap(swapAmount, user1.address, hikariTokenAddress)
      ).to.be.revertedWith("Invalid input token");

      await expect(
        dex.connect(user1).swap(swapAmount, kaizenTokenAddress, user1.address)
      ).to.be.revertedWith("Invalid output token");
    });

    it("Should revert when swapping the same token", async function () {
      await expect(
        dex
          .connect(user1)
          .swap(swapAmount, kaizenTokenAddress, kaizenTokenAddress)
      ).to.be.revertedWith("Cannot swap same token");
    });
  });

  describe("Price Calculation", function () {
    it("Should calculate correct output amount", async function () {
      const amountIn = ethers.parseEther("10");
      const reserveIn = ethers.parseEther("100");
      const reserveOut = ethers.parseEther("200");

      const fee = 1;

      // Using BigInt operations
      const amountInWithFee = amountIn * BigInt(1000 - fee);
      const numerator = amountInWithFee * reserveOut;
      const denominator = reserveIn * BigInt(1000) + amountInWithFee;

      const expectedAmountOut = numerator / denominator;

      const amountOut = await dex.getAmountOut(amountIn, reserveIn, reserveOut);

      expect(amountOut).to.be.closeTo(
        expectedAmountOut,
        ethers.parseEther("0.000000000000001") // Small tolerance for precision errors
      );
    });

    it("Should revert with zero input amount", async function () {
      await expect(dex.getAmountOut(0, 100, 100)).to.be.revertedWith(
        "Insufficient input amount"
      );
    });

    it("Should revert with insufficient liquidity", async function () {
      await expect(dex.getAmountOut(100, 0, 100)).to.be.revertedWith(
        "Insufficient liquidity"
      );

      await expect(dex.getAmountOut(100, 100, 0)).to.be.revertedWith(
        "Insufficient liquidity"
      );
    });
  });
});
