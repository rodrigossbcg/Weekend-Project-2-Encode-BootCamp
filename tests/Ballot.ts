import { expect } from "chai";
import { ethers } from "hardhat";
import { encodeBytes32String } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const proposals = ["P1", "P2", "P3"];

async function deployContract() {
    const contractFactory = await ethers.getContractFactory("Ballot");
    const ballotContract = await contractFactory.deploy(proposals.map(encodeBytes32String));
    await ballotContract.waitForDeployment();
    const accounts = await ethers.getSigners();
    return { ballotContract, accounts}
};


describe("When the contract is deployed", async () => {


    it("The deployer is the chairperson", async () => {
        const { ballotContract, accounts } = await loadFixture(deployContract);
        const signer = accounts[0].address;
        // get an attribute from the blockchain
        const chairperson = await ballotContract.chairperson();
        expect(chairperson).to.eq(signer)
    });

    it("The proposals are the provided", async () => {
        const { ballotContract, accounts } = await loadFixture(deployContract);
        for (let index = 0; index < proposals.length; index++) {
            // get an attribute (array) from the blockchain
            const proposal = await ballotContract.proposals(index);
            // convert bytes32 to string and compare to the initial input
            expect(proposals[index]).to.eq(ethers.decodeBytes32String(proposal.name))
        }
    });

    it("Has all the proposals with 0 votes", async () => {
        const { ballotContract, accounts } = await loadFixture(deployContract);
        const deployerAddress = accounts[0].address;
        for (let index = 0; index < proposals.length; index++) {
            const proposal = await ballotContract.proposals(index);
            expect(0).to.eq(proposal.voteCount);
        }
    });

})