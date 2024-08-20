// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import {MailboxTest} from "./_Mailbox_Shared.t.sol";
import {DummyBridgehub} from "contracts/dev-contracts/test/DummyBridgehub.sol";
import {L1AssetRouter} from "contracts/bridge/L1AssetRouter.sol";
import {IBridgehub} from "contracts/bridgehub/IBridgehub.sol";
import {IL1AssetRouter} from "contracts/bridge/interfaces/IL1AssetRouter.sol";
import {DummySharedBridge} from "contracts/dev-contracts/test/DummySharedBridge.sol";

contract MailboxFinalizeWithdrawal is MailboxTest {
    bytes32[] proof;
    bytes message;
    DummySharedBridge L1AssetRouter;
    address baseTokenBridgeAddress;

    function setUp() public virtual {
        setupDiamondProxy();

        L1AssetRouter = new DummySharedBridge(keccak256("dummyDepositHash"));
        baseTokenBridgeAddress = address(L1AssetRouter);

        proof = new bytes32[](0);
        message = "message";
    }

    function test_RevertWhen_notEra() public {
        utilsFacet.util_setChainId(eraChainId + 1);

        vm.expectRevert("Mailbox: finalizeEthWithdrawal only available for Era on mailbox");
        mailboxFacet.finalizeEthWithdrawal({
            _l2BatchNumber: 0,
            _l2MessageIndex: 0,
            _l2TxNumberInBatch: 0,
            _message: message,
            _merkleProof: proof
        });
    }

    function test_success_withdrawal(uint256 amount) public {
        address baseTokenBridge = makeAddr("baseTokenBridge");
        utilsFacet.util_setChainId(eraChainId);
        utilsFacet.util_setBaseTokenBridge(baseTokenBridgeAddress);

        address l1Receiver = makeAddr("receiver");
        address l1Token = address(1);
        vm.deal(baseTokenBridgeAddress, amount);

        bytes memory message = abi.encode(l1Receiver, l1Token, amount);

        mailboxFacet.finalizeEthWithdrawal({
            _l2BatchNumber: 0,
            _l2MessageIndex: 0,
            _l2TxNumberInBatch: 0,
            _message: message,
            _merkleProof: proof
        });

        assertEq(l1Receiver.balance, amount);
        assertEq(baseTokenBridgeAddress.balance, 0);
    }
}
