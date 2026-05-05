import { providers, utils } from "ethers";

export type NounsDaoProposal = {
  proposalId: string;
  proposalNumber: number;
  title: string;
  description: string;
  timeCreated: string;
  voteEndBlock: number;
  state: number;
  transactionHash: string;
};

const NOUNS_DAO_PROXY = "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d";
const NOUNS_DAO_START_BLOCK = 12985451;
const BLOCK_RANGE = 50000;
const MAX_PROPOSALS = 60;

const nounsDaoInterface = new utils.Interface([
  "event ProposalCreated(uint256 id,address proposer,address[] targets,uint256[] values,string[] signatures,bytes[] calldatas,uint256 startBlock,uint256 endBlock,string description)",
  "event ProposalCreatedWithRequirements(uint256 id,address proposer,address[] targets,uint256[] values,string[] signatures,bytes[] calldatas,uint256 startBlock,uint256 endBlock,uint256 proposalThreshold,uint256 quorumVotes,string description,uint8 clientId)",
  "function state(uint256 proposalId) view returns (uint8)",
]);

const provider = new providers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "https://ethereum.publicnode.com"
);

const stripMarkdownTitle = (value: string) =>
  value
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^title:\s*/i, "")
    .trim();

const getProposalTitle = (description: string, id: string) => {
  const firstLine = description
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? stripMarkdownTitle(firstLine) : `Nouns Proposal ${id}`;
};

export const getNounsDaoProposals = async () => {
  const latestBlock = Math.max(
    NOUNS_DAO_START_BLOCK,
    (await provider.getBlockNumber()) - 25
  );
  const proposalTopics = [
    nounsDaoInterface.getEventTopic("ProposalCreated"),
    nounsDaoInterface.getEventTopic("ProposalCreatedWithRequirements"),
  ];
  let toBlock = latestBlock;
  let logs: providers.Log[] = [];

  while (logs.length < MAX_PROPOSALS && toBlock > NOUNS_DAO_START_BLOCK) {
    const fromBlock = Math.max(NOUNS_DAO_START_BLOCK, toBlock - BLOCK_RANGE);
    const rangeLogs = await provider.getLogs({
      address: NOUNS_DAO_PROXY,
      fromBlock,
      toBlock,
      topics: [proposalTopics],
    });

    logs = [...rangeLogs, ...logs];
    toBlock = fromBlock - 1;
  }

  const recentLogs = logs.slice(-MAX_PROPOSALS).reverse();

  return Promise.all(
    recentLogs.map(async (log) => {
      const parsed = nounsDaoInterface.parseLog(log);
      const proposalId = parsed.args.id.toString();
      const [block, state] = await Promise.all([
        provider.getBlock(log.blockNumber),
        provider
          .call({
            to: NOUNS_DAO_PROXY,
            data: nounsDaoInterface.encodeFunctionData("state", [proposalId]),
          })
          .then((result) =>
            Number(nounsDaoInterface.decodeFunctionResult("state", result)[0])
          )
          .catch(() => 0),
      ]);
      const description = parsed.args.description as string;

      return {
        proposalId,
        proposalNumber: Number(proposalId),
        title: getProposalTitle(description, proposalId),
        description,
        timeCreated: String(block.timestamp),
        voteEndBlock: Number(parsed.args.endBlock.toString()),
        state,
        transactionHash: log.transactionHash,
      } satisfies NounsDaoProposal;
    })
  );
};
