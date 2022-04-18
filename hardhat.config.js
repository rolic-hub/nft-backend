require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.4",
   networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/SdK6d1bn1DIz38tXW8s9IWbJ90w8l1XW",
      accounts: [
        "ae6299370a324e801c2d005d5dcc965cd4e1d29d75832e55bb80f6e2ae8bd8ca"
      ],
    },
  },
};
