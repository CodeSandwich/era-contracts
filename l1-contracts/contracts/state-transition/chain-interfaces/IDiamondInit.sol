// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {L2CanonicalTransaction} from "../../common/Messaging.sol";
import {IVerifier, VerifierParams} from "./IVerifier.sol";
import {FeeParams} from "../chain-deps/ZkSyncStateTransitionStorage.sol";

/// @param chainId
/// @param stateTransition contract's address
/// @param verifier address of Verifier contract
/// @param admin address who can manage the contract
/// @param allowList The address of the allow list smart contract
/// @param verifierParams Verifier config parameters that describes the circuit to be verified
/// @param l2BootloaderBytecodeHash The hash of bootloader L2 bytecode
/// @param l2DefaultAccountBytecodeHash The hash of default account L2 bytecode
/// @param priorityTxMaxGasLimit maximum number of the L2 gas that a user can request for L1 -> L2 transactions
struct InitializeData {
    uint256 chainId;
    address bridgehub;
    address stateTransitionManager;
    uint256 protocolVersion;
    address admin;
    address validatorTimelock;
    address baseToken;
    address baseTokenBridge;
    bytes32 storedBatchZero;
    IVerifier verifier;
    VerifierParams verifierParams;
    bytes32 l2BootloaderBytecodeHash;
    bytes32 l2DefaultAccountBytecodeHash;
    uint256 priorityTxMaxGasLimit;
    FeeParams feeParams;
}

interface IDiamondInit {
    function initialize(InitializeData calldata _initData) external returns (bytes32);
}
