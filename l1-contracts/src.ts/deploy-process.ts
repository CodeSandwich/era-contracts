// import * as hardhat from "hardhat";
// import "@nomiclabs/hardhat-ethers";
import type { BigNumberish, Wallet } from "ethers";
import { ethers } from "ethers";

import type { FacetCut } from "./diamondCut";

import { Deployer } from "./deploy";
import { deployTokens, getTokens } from "./deploy-token";
import * as fs from "fs";

const testConfigPath = "./test/test_config/constant";
export const ethTestConfig = JSON.parse(fs.readFileSync(`${testConfigPath}/eth.json`, { encoding: "utf-8" }));
const addressConfig = JSON.parse(fs.readFileSync(`${testConfigPath}/addresses.json`, { encoding: "utf-8" }));
const testnetTokenPath = `${testConfigPath}/hardhat.json`;

import { ADDRESS_ONE } from "../src.ts/utils";

const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const L2_BOOTLOADER_BYTECODE_HASH = "0x1000100000000000000000000000000000000000000000000000000000000000";
export const L2_DEFAULT_ACCOUNT_BYTECODE_HASH = "0x1001000000000000000000000000000000000000000000000000000000000000";

export async function loadDefaultEnvVarsForTests(deployWallet: Wallet) {
  process.env.CONTRACTS_LATEST_PROTOCOL_VERSION = (21).toString();
  process.env.CONTRACTS_GENESIS_ROOT = zeroHash;
  process.env.CONTRACTS_GENESIS_ROLLUP_LEAF_INDEX = "0";
  process.env.CONTRACTS_GENESIS_BATCH_COMMITMENT = zeroHash;
  process.env.CONTRACTS_PRIORITY_TX_MAX_GAS_LIMIT = "72000000";
  process.env.CONTRACTS_RECURSION_NODE_LEVEL_VK_HASH = zeroHash;
  process.env.CONTRACTS_RECURSION_LEAF_LEVEL_VK_HASH = zeroHash;
  process.env.CONTRACTS_RECURSION_CIRCUITS_SET_VKS_HASH = zeroHash;
  process.env.ETH_CLIENT_CHAIN_ID = (await deployWallet.getChainId()).toString();
}

export async function defaultDeployerForTests(deployWallet: Wallet, ownerAddress: string): Promise<Deployer> {
  return new Deployer({
    deployWallet,
    ownerAddress,
    verbose: false, // change here to view deployement
    addresses: addressConfig,
    bootloaderBytecodeHash: L2_BOOTLOADER_BYTECODE_HASH,
    defaultAccountBytecodeHash: L2_DEFAULT_ACCOUNT_BYTECODE_HASH,
  });
}

export async function initialBridgehubDeployment(
  deployer: Deployer,
  extraFacets: FacetCut[],
  gasPrice: BigNumberish,
  onlyVerifier: boolean,
  diamondUpgradeInit: number,
  create2Salt?: string,
  nonce?: number
) {
  nonce = nonce || (await deployer.deployWallet.getTransactionCount());
  create2Salt = create2Salt || ethers.utils.hexlify(ethers.utils.randomBytes(32));

  // Create2 factory already deployed on the public networks, only deploy it on local node
  if (process.env.CHAIN_ETH_NETWORK === "localhost" || process.env.CHAIN_ETH_NETWORK === "hardhat") {
    await deployer.deployCreate2Factory({ gasPrice, nonce });
    nonce++;

    await deployer.deployMulticall3(create2Salt, { gasPrice, nonce });
    nonce++;
  }

  if (onlyVerifier) {
    await deployer.deployVerifier(create2Salt, { gasPrice, nonce });
    return;
  }

  // Deploy diamond upgrade init contract if needed
  const diamondUpgradeContractVersion = diamondUpgradeInit || 1;
  if (diamondUpgradeContractVersion) {
    await deployer.deployDiamondUpgradeInit(create2Salt, diamondUpgradeContractVersion, {
      gasPrice,
      nonce,
    });
    nonce++;
  }

  await deployer.deployDefaultUpgrade(create2Salt, {
    gasPrice,
    nonce,
  });
  nonce++;

  await deployer.deployGenesisUpgrade(create2Salt, {
    gasPrice,
    nonce,
  });
  nonce++;

  await deployer.deployValidatorTimelock(create2Salt, { gasPrice, nonce });
  nonce++;

  await deployer.deployGovernance(create2Salt, { gasPrice, nonce });
  await deployer.deployTransparentProxyAdmin(create2Salt, { gasPrice });
  await deployer.deployBridgehubContract(create2Salt, gasPrice);
  await deployer.deployBlobVersionedHashRetriever(create2Salt, { gasPrice});
  await deployer.deployStateTransitionManagerContract(create2Salt, extraFacets, gasPrice);
  await deployer.setStateTransitionManagerInValidatorTimelock({ gasPrice });

  /// not the weird order is in order, mimics historical deployment process
  await deployer.deployERC20BridgeProxy(create2Salt, { gasPrice });
  await deployer.deploySharedBridgeContracts(create2Salt, gasPrice);
  await deployer.deployERC20BridgeImplementation(create2Salt, { gasPrice });
  await deployer.upgradeL1ERC20Bridge();
}

export async function registerHyperchain(
  deployer: Deployer,
  extraFacets: FacetCut[],
  gasPrice: BigNumberish,
  baseTokenName?: string
) {
  const testnetTokens = getTokens();

  const baseTokenAddress = baseTokenName
    ? testnetTokens.find((token: { symbol: string }) => token.symbol == baseTokenName).address
    : ADDRESS_ONE;

  if (!(await deployer.bridgehubContract(deployer.deployWallet).tokenIsRegistered(baseTokenAddress))) {
    await deployer.registerToken(baseTokenAddress);
  }
  await deployer.registerHyperchain(baseTokenAddress, extraFacets, gasPrice);
}

export async function initialTestnetDeploymentProcess(
  deployWallet: Wallet,
  ownerAddress: string,
  gasPrice: BigNumberish,
  extraFacets: FacetCut[],
  baseTokenName?: string
): Promise<Deployer> {
  await loadDefaultEnvVarsForTests(deployWallet);
  const deployer = await defaultDeployerForTests(deployWallet, ownerAddress);

  const testnetTokens = getTokens();
  const result = await deployTokens(testnetTokens, deployer.deployWallet, null, false, deployer.verbose);
  fs.writeFileSync(testnetTokenPath, JSON.stringify(result, null, 2));

  await initialBridgehubDeployment(deployer, extraFacets, gasPrice, false, 1);
  await registerHyperchain(deployer, extraFacets, gasPrice, baseTokenName);
  return deployer;
}
