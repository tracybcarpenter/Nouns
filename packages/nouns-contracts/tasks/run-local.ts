import { TASK_COMPILE, TASK_NODE } from 'hardhat/builtin-tasks/task-names';
import { task } from 'hardhat/config';

task(
  'run-local',
  'Start a hardhat node, deploy contracts, and execute setup transactions',
).setAction(async (_, { ethers, run }) => {
  await run(TASK_COMPILE);

  await Promise.race([run(TASK_NODE), new Promise(resolve => setTimeout(resolve, 2_000))]);

  const contracts = await run('deploy-local');

  await run('populate-descriptor', {
    nftDescriptor: contracts.NFTDescriptor.instance.address,
    nounsDescriptor: contracts.NounsDescriptor.instance.address,
  });

  await contracts.NounsAuctionHouse.instance
    .attach(contracts.NounsAuctionHouseProxy.instance.address)
    .unpause({
      gasLimit: 1_000_000,
    });

  await run('create-proposal', {
    nounsDaoProxy: contracts.NounsDAOProxy.instance.address,
  });

  const { chainId } = await ethers.provider.getNetwork();

  const accounts = {
    'Account #0': {
      Address: '0xAFbC1EA30f04Ec1CAe37CfF005b1c36BeAE5e84C',
      'Private Key': '0xacd3add524ea087cb551262f3cc5b9753ae201a26c9171388e31b3a0c7715f6c',
    },
    'Account #1': {
      Address: '0xeFE19A3723ec527275132e9191C0767FAfe3f24e',
      'Private Key': '0xe470c9f22436c57b8bd276ce917ffe46fd49990772b744c2f8c1633fc7539540',
    },
  };

  console.table(accounts);
  console.log(
    `Noun contracts deployed to local node at http://localhost:8545 (Chain ID: ${chainId})`,
  );
  console.log(`Auction House Proxy address: ${contracts.NounsAuctionHouseProxy.instance.address}`);
  console.log(`Nouns ERC721 address: ${contracts.NounsToken.instance.address}`);
  console.log(`Nouns DAO Executor address: ${contracts.NounsDAOExecutor.instance.address}`);
  console.log(`Nouns DAO Proxy address: ${contracts.NounsDAOProxy.instance.address}`);

  await ethers.provider.send('evm_setIntervalMining', [12_000]);

  await new Promise(() => {
    /* keep node alive until this process is killed */
  });
});
