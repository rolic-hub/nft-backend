const { ethers } = require("ethers");


const main = async () => {

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();

  await nft.deployed();

  console.log("Nft deployed to:", nft.address);

  const MarketPlace = await hre.ethers.getContractFactory("MarketPlace");
  const market= await MarketPlace.deploy(1);

  await market.deployed();

  console.log("MarketPlace deployed to:", market.address);
  

 
};

const runMain = () => {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
};

runMain();
