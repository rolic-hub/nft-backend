require("@nomiclabs/hardhat-waffle");
import dotenv from "dotenv";
dotenv.config();

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: process.env.ALCHEMY_API_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
