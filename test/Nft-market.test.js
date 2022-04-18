const { expect } = require("chai");
const { ethers } = require("ethers");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("Nft-market", () => {
  let deployer, addr1, addr2, nft, marketplace;
  let feePercent = 1;
  let URI = "sample URI";

  beforeEach(async () => {
    const NFT = await hre.ethers.getContractFactory("NFT");
    const MarketPlace = await hre.ethers.getContractFactory("MarketPlace");

    [deployer, addr1, addr2] = await hre.ethers.getSigners();

    nft = await NFT.deploy();
    marketplace = await MarketPlace.deploy(feePercent);
  });
  describe("Deployment", () => {
    it("should track name and symbol of the nft collection", async () => {
      expect(await nft.name()).to.equal("epicNFT");
      expect(await nft.symbol()).to.equal("EPIC");
    });
    it("Should track feeAccount and feePercent of the marketplace", async () => {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });
  describe("Minting Nfts", () => {
    it("Should track each minted NFT", async () => {
      await nft.connect(addr1).mint(URI);
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);

      await nft.connect(addr2).mint(URI);
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  });

  describe("Making marketplace items", () => {
    beforeEach(async () => {
      await nft.connect(addr1).mint(URI);
      //approve marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });
    it("Should track newly created item, transfer NFT from seller to marketplace and emit offered event", async () => {
      // addr1 offers their nft at a price of 1 eth
      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, toWei(1))
      )
        .to.emit(marketplace, "offered")
        .withArgs(1, nft.address, 1, toWei(1), addr1.address);
      //check if marketplace now owns d nft
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      expect(await marketplace.itemCount()).to.equal(1);

      const item = await marketplace.items(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(toWei(1));
      expect(item.sold).to.equal(false);
    });
    it("Should fail if price is set to zero", async () => {
      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("Purchasing marketPlace items", () => {
    const price = 2;
    let totalPriceWei;
    beforeEach(async () => {
      await nft.connect(addr1).mint(URI);
      //approve marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price));
    });
    it("Should set item to sold, pay seller, transfer NFT to buyer, chareg fees and emit bought event", async () => {
      const initialBalance = await addr1.getBalance();
      const feeInitialbal = await deployer.getBalance();

      totalPriceWei = await marketplace.getTotalPrice(1);
      //addr2 purchases item
      await expect(
        marketplace.connect(addr2).purchaseItem(1, { value: totalPriceWei })
      )
        .to.emit(marketplace, "bought")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        );
      const sellerFinalbal = await addr1.getBalance();
      const feeAccountBal = await deployer.getBalance();
      //seller should recieve payment for the price of the nft sold
    expect(+fromWei(sellerFinalbal)).to.equal(+price + +fromWei(initialBalance) )

      const fee = (feePercent * price) /100 ;
      //feeAcc should recieve fee
      expect(+fromWei(feeAccountBal)).to.equal(+fee + +fromWei(feeInitialbal));
      //the buyer should now own the nft
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
      //item should be marked as sold
      expect((await marketplace.items(1)).sold).to.equal(true);
    });

    it("Should fail for invalid itemIds, sold items and when not enough ether is paid", async () => {
      //invalid item ids
      await expect(
        marketplace.connect(addr2).purchaseItem(2, { value: totalPriceWei })
      ).to.be.revertedWith("item doesn't exist");
      await expect(
        marketplace.connect(addr2).purchaseItem(0, { value: totalPriceWei })
      ).to.be.revertedWith("item doesn't exist");

      //not enough ether
      await expect(
        marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
      ).to.be.revertedWith(
        "Not enough ether to cover item price and market fee"
      );

      await marketplace.connect(addr1).purchaseItem(1, {value: totalPriceWei});

      //deployer tries purchasing item 1 afta it has been sold
      await expect(
        marketplace.connect(deployer).purchaseItem(1, { value: totalPriceWei })
      ).to.be.revertedWith("item already sold");

    });
  });
});
