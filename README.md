# Decentralized Exchange (DEX) Project

This Decentralized Exchange (DEX) project is a Solidity-based implementation of a simple token swap platform. It allows users to exchange ERC20 tokens directly on the blockchain without the need for a centralized intermediary. The project uses an Automated Market Maker (AMM) model with a constant product formula for determining exchange rates.

## Project Structure

The project follows a structured layout for better organization:

- **decentralized-exchange/**
  - **contracts/** _(Contains the Solidity smart contracts)_
    - `decentralized-exchange.sol` _(The main DEX contract)_
    - `Kaizen.sol` _(ERC20 token for testing)_
    - `Hikari.sol` _(ERC20 token for testing)_
  - **scripts/** _(Contains the deployment scripts)_
    - `deploy.js` _(Deploys the DEX and test token contracts)_
  - **test/** _(Contains the test cases for the contracts)_
    - `dex.test.js` _(Unit tests for the DEX contract)_
  - **hardhat.config.js** _(Hardhat configuration file)_

## Features

- **Token Swaps**: Users can swap between two ERC20 tokens.
- **Liquidity Provision**: Users can add liquidity to the exchange.
- **Automated Market Making**: Uses a constant product formula (x \* y = k) to determine exchange rates.
- **Event Logging**: Emits events for swaps for easy tracking and frontend updates.

## Getting Started

### Prerequisites

- Node.js (Recommended version: 18.x)
- Hardhat
- MetaMask (for interacting with the deployed contract)
- Ethereum testnet (like Goerli or local Hardhat network)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/onaisahmed/decentralized-exchange.git
   cd decentralized-exchange
   ```

2. **Install the dependencies**:

   ```bash
   npm install
   ```

### Compiling the Contracts

1. Run the following command to compile the Solidity contracts:

   ```bash
   npx hardhat compile
   ```

### Deploying the Contracts

1. To deploy the contracts to a local blockchain, run the Hardhat node:

   ```bash
   npx hardhat node
   ```

2. Deploy the DEX and test token contracts to the local network:

   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

   The contract addresses will be printed in the console after deployment.

### Interacting with the DEX

You can interact with the DEX contract using the Hardhat console or via scripts. Some key functions include:

- **Swap Tokens**:

  ```js
  await dex.swap(amountIn, token1.address, token2.address);
  ```

- **Add Liquidity**:

  ```js
  await dex.addLiquidity(amount1, amount2);
  ```

## Smart Contract Details

The main DEX contract (`decentralized-exchange.sol`) implements the following key functions:

- `swap`: Allows users to swap between the two tokens.
- `addLiquidity`: Allows users to add liquidity to the pool.

The contract uses events to log important actions:

- `Swap`: Emitted when a swap occurs.

## Testing the Contracts

1. Write test cases in the `test/dex.test.js` file.
2. Run the test cases using Hardhat:

   ```bash
   npx hardhat test
   ```
