import { ethers } from "ethers";
import * as readline from "readline";
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function userInput(text: string): Promise<string> {
  return new Promise<string>((resolve) => {
    rl.question(text, (answer) => {
      resolve(answer);
    });
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function setupProvider() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_URL ?? "");
  return provider;
};


async function connectContract() {

  // Connect to a provider
  const provider = setupProvider();
  const lastBlock = await provider.getBlock("latest");
  console.log(`Connected to the blockchain on block number: ${lastBlock?.number}`);

  // Connect to a Wallet
  const privateKey = await userInput("Paste your wallet private key: ");
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Connected to Wallet");

  // Get ABI
  const jsonData = JSON.parse(readFileSync("artifacts/contracts/Ballot.sol/Ballot.json", 'utf8'));
  const abi = jsonData["abi"];

  // Connect to contract
  const contractAddress = await userInput("Enter the contract address: ");
  const ballotContract = new ethers.Contract(contractAddress, abi, wallet);
  console.log(`Chairperson ${await ballotContract.chairperson()}`)

  return ballotContract
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function giveVoteRight(contract: ethers.Contract) {
  const to = await userInput("Give voting rights to address: ");
  const tx = await contract.giveRightToVote(to);
  console.log(tx);
};

async function delegateVote(contract: ethers.Contract) {
  const to = await userInput("Delegate votes to address: ");
  const tx = await contract.delegate(to);
  console.log(tx);
};

async function vote(contract: ethers.Contract) {
  const proposalNumber = Number(await userInput("Proposal number: "));
  const tx = await contract.vote(proposalNumber);
  console.log(tx);
};

async function queryResults(contract: ethers.Contract) {

  for (let i = 0; 100; i++) {

    try {
      const proposal = await contract.proposals(i);
      const name = ethers.decodeBytes32String(proposal.name);
      const votes = proposal.voteCount
      console.log(`${votes} votes - Proporsal ${i}: ${name}`);
    }

    catch {
      console.log("No more proposals to show...")
      return null
    };
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function main() {

    const contract = await connectContract()
    const functionIndex = process.argv.slice(2)[0];

    if (functionIndex == "GVR") {
      giveVoteRight(contract);
    };

    if (functionIndex == "DV") {
      delegateVote(contract);
    };

    if (functionIndex == "V") {
      vote(contract);
    };

    if (functionIndex == "QR") {
      queryResults(contract);
    };

    return contract
  }


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
