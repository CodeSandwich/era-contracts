import { expect } from "chai";
import type * as ethers from "ethers";
import * as hardhat from "hardhat";

import type { AdminFacetTest } from "../../typechain";
import { AdminFacetTestFactory, GovernanceFactory } from "../../typechain";

import { getCallRevertReason, randomAddress } from "./utils";

describe("Admin facet tests", function () {
  let adminFacetTest: AdminFacetTest;
  let randomSigner: ethers.Signer;

  before(async () => {
    const contractFactory = await hardhat.ethers.getContractFactory("AdminFacetTest");
    const contract = await contractFactory.deploy();
    adminFacetTest = AdminFacetTestFactory.connect(contract.address, contract.signer);

    const governanceContract = await contractFactory.deploy();
    const governance = GovernanceFactory.connect(governanceContract.address, governanceContract.signer);
    await adminFacetTest.setPendingGovernor(governance.address);

    randomSigner = (await hardhat.ethers.getSigners())[1];
  });

  it("StateTransitionManager successfully set validator", async () => {
    const validatorAddress = randomAddress();
    await adminFacetTest.setValidator(validatorAddress, true);

    const isValidator = await adminFacetTest.isValidator(validatorAddress);
    expect(isValidator).to.equal(true);
  });

  it("random account fails to set validator", async () => {
    const validatorAddress = randomAddress();
    const revertReason = await getCallRevertReason(
      adminFacetTest.connect(randomSigner).setValidator(validatorAddress, true)
    );
    expect(revertReason).equal("StateTransition Chain: not state transition manager");
  });

  it("StateTransitionManager successfully set porter availability", async () => {
    await adminFacetTest.setPorterAvailability(true);

    const porterAvailability = await adminFacetTest.getPorterAvailability();
    expect(porterAvailability).to.equal(true);
  });

  it("random account fails to set porter availability", async () => {
    const revertReason = await getCallRevertReason(adminFacetTest.connect(randomSigner).setPorterAvailability(false));
    expect(revertReason).equal("StateTransition Chain: not state transition manager");
  });

  it("StateTransitionManager successfully set priority transaction max gas limit", async () => {
    const gasLimit = "12345678";
    await adminFacetTest.setPriorityTxMaxGasLimit(gasLimit);

    const newGasLimit = await adminFacetTest.getPriorityTxMaxGasLimit();
    expect(newGasLimit).to.equal(gasLimit);
  });

  it("random account fails to priority transaction max gas limit", async () => {
    const gasLimit = "123456789";
    const revertReason = await getCallRevertReason(
      adminFacetTest.connect(randomSigner).setPriorityTxMaxGasLimit(gasLimit)
    );
    expect(revertReason).equal("StateTransition Chain: not state transition manager");
  });

  describe("change governor", function () {
    let newGovernor: ethers.Signer;

    before(async () => {
      newGovernor = (await hardhat.ethers.getSigners())[2];
    });

    it("set pending governor", async () => {
      const proposedGovernor = await randomSigner.getAddress();
      await adminFacetTest.setPendingGovernor(proposedGovernor);

      const pendingGovernor = await adminFacetTest.getPendingAdmin();
      expect(pendingGovernor).equal(proposedGovernor);
    });

    it("reset pending governor", async () => {
      const proposedGovernor = await newGovernor.getAddress();
      await adminFacetTest.setPendingGovernor(proposedGovernor);

      const pendingGovernor = await adminFacetTest.getPendingAdmin();
      expect(pendingGovernor).equal(proposedGovernor);
    });

    it("failed to accept governor from not proposed account", async () => {
      const revertReason = await getCallRevertReason(adminFacetTest.connect(randomSigner).acceptGovernor());
      expect(revertReason).equal("n4");
    });

    it("accept governor from proposed account", async () => {
      await adminFacetTest.connect(newGovernor).acceptGovernor();

      const governor = await adminFacetTest.getAdmin();
      expect(governor).equal(await newGovernor.getAddress());
    });
  });
});
