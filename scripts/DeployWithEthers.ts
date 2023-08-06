import { encodeBytes32String } from "ethers";
import { ethers } from "ethers";
import { Ballot__factory } from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config();


function setupProvider() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_URL ?? "");
  return provider;
};

async function main() {

  // Get parameters form script execution
  const proposals = process.argv.slice(2);

  // Connect to a provider
  const provider = setupProvider();
  const lastBlock = await provider.getBlock("latest");
  console.log(`Last block is ${lastBlock?.number}`);

  // Connect to a Wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);

  // Get balance
  const balanceBN = await provider.getBalance(wallet.address);
  const balance = Number(ethers.formatUnits(balanceBN));
  console.log(`Wallet balance ${balance}`);

  // Check if the balance is enough
  if (balance < 0.01) {
    // throw error
    throw new Error("Not enough ether");
  }

  else {
    // Deploy contract
    const ballotFactory = new Ballot__factory(wallet);
    const ballotContract = await ballotFactory.deploy(proposals.map(encodeBytes32String));
    await ballotContract.waitForDeployment();

    // Show the address of deployment
    const dployedAt = await ballotContract.getAddress();
    console.log(`Contract deplyed at ${dployedAt}`)

    // Read the proposals from the blockchain
    for (let i = 0; i < proposals.length; i++) {
      const proposal = await ballotContract.proposals(i);
      const name = ethers.decodeBytes32String(proposal.name);
      console.log(i, name);
    }
  }

};


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
