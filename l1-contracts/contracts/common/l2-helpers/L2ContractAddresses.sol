// SPDX-License-Identifier: MIT
// We use a floating point pragma here so it can be used within other projects that interact with the ZKsync ecosystem without using our exact pragma version.
pragma solidity ^0.8.21;

import {IBaseToken} from "./IBaseToken.sol";
import {IL2Messenger} from "./IL2Messenger.sol";
import {IAccountCodeStorage} from "./IAccountCodeStorage.sol";

/// @dev The formal address of the initial program of the system: the bootloader
address constant L2_BOOTLOADER_ADDRESS = address(0x8001);

/// @dev The address of the known code storage system contract
address constant L2_KNOWN_CODE_STORAGE_SYSTEM_CONTRACT_ADDR = address(0x8004);

/// @dev The address of the L2 deployer system contract.
address constant L2_DEPLOYER_SYSTEM_CONTRACT_ADDR = address(0x8006);

/// @dev The special reserved L2 address. It is located in the system contracts space but doesn't have deployed
/// bytecode.
/// @dev The L2 deployer system contract allows changing bytecodes on any address if the `msg.sender` is this address.
/// @dev So, whenever the governor wants to redeploy system contracts, it just initiates the L1 upgrade call deployer
/// system contract
/// via the L1 -> L2 transaction with `sender == L2_FORCE_DEPLOYER_ADDR`. For more details see the
/// `diamond-initializers` contracts.
address constant L2_FORCE_DEPLOYER_ADDR = address(0x8007);

/// @dev The address of the special smart contract that can send arbitrary length message as an L2 log
address constant L2_TO_L1_MESSENGER_SYSTEM_CONTRACT_ADDR = address(0x8008);

/// @dev The address of the eth token system contract
address constant L2_BASE_TOKEN_SYSTEM_CONTRACT_ADDR = address(0x800a);

/// @dev The address of the context system contract
address constant L2_SYSTEM_CONTEXT_SYSTEM_CONTRACT_ADDR = address(0x800b);

/// @dev The address of the pubdata chunk publisher contract
address constant L2_PUBDATA_CHUNK_PUBLISHER_ADDR = address(0x8011);

/// @dev The address used to execute complex upgragedes, also used for the genesis upgrade
address constant L2_COMPLEX_UPGRADER_ADDR = address(0x800f);

/// @dev The address used to execute the genesis upgrade
address constant L2_GENESIS_UPGRADE_ADDR = address(0x10001);

/// @dev The address of the L2 bridge hub system contract, used to start L2<>L2 transactions
address constant L2_BRIDGEHUB_ADDR = address(0x10002);

/// @dev the address of the l2 asset router.
address constant L2_ASSET_ROUTER_ADDR = address(0x10003);

/// @dev An l2 system contract address, used in the assetId calculation for native assets.
/// This is needed for automatic bridging, i.e. without deploying the AssetHandler contract,
/// if the assetId can be calculated with this address then it is in fact an NTV asset
address constant L2_NATIVE_TOKEN_VAULT_ADDR = address(0x10004);

/// @dev the address of the l2 asset router.
address constant L2_MESSAGE_ROOT_ADDR = address(0x10005);

/// @dev the address of the L2 interop center
address constant L2_INTEROP_CENTER_ADDR = address(0x10006);

/// @dev the offset for the system contracts
uint160 constant SYSTEM_CONTRACTS_OFFSET = 0x8000; // 2^15

/// @dev the address of the deployer system contract
address constant DEPLOYER_SYSTEM_CONTRACT = address(SYSTEM_CONTRACTS_OFFSET + 0x06);

/// @dev the address of the l2 messenger system contract
IL2Messenger constant L2_MESSENGER = IL2Messenger(address(SYSTEM_CONTRACTS_OFFSET + 0x08));

/// @dev the address of the msg value system contract
address constant MSG_VALUE_SYSTEM_CONTRACT = address(SYSTEM_CONTRACTS_OFFSET + 0x09);

IAccountCodeStorage constant ACCOUNT_CODE_STORAGE_SYSTEM_CONTRACT = IAccountCodeStorage(
    address(SYSTEM_CONTRACTS_OFFSET + 0x02)
);

IBaseToken constant BASE_TOKEN_SYSTEM_CONTRACT = IBaseToken(address(SYSTEM_CONTRACTS_OFFSET + 0x0a));