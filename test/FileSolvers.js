const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
require("dotenv").config();

describe("FileSolvers", function () {
  async function deployFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();

    const Contract = await hre.ethers.getContractFactory("FileSolvers");
    const contract = await Contract.deploy();
    await contract.waitForDeployment();

    return { contract, owner, account1, account2 };
  }

  async function createSimpleRequest(contract, user) {
    await contract
      .connect(user)
      .createRequest(
        "Simple description",
        ["pdf", "doc", "docx"],
        hre.ethers.parseEther("0.1"),
        Math.floor(Date.now() / 1000) + 2000
      );

    // Get request
    const request = await contract.getRequest(0);

    return request;
  }

  describe("Deploy", function () {
    it("Should deploy", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(contract.target).to.be.a("string");
    });
  });

  describe("Create new request", function () {
    it("Should create new request and get it", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const tx = await contract
        .connect(owner)
        .createRequest(
          "Simple description",
          ["pdf", "doc", "docx"],
          hre.ethers.parseEther("0.1"),
          Math.floor(Date.now() / 1000) + 2000
        );

      // Check tx is not reverted
      expect(tx).to.not.be.not.reverted;

      // Get request created
      const request = await contract.getRequest(0);
      expect(Number(request[0])).to.be.equal(0);
    });
    it("Shouldn't create new request without required fields", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Without description
      await expect(
        contract
          .connect(owner)
          .createRequest(
            "",
            ["pdf", "doc", "docx"],
            hre.ethers.parseEther("0.1"),
            Math.floor(Date.now() / 1000) + 2000
          )
      ).to.be.revertedWithCustomError(contract, "MissingParams");

      // With a wrong amount
      await expect(
        contract
          .connect(owner)
          .createRequest(
            "Simple description",
            ["pdf", "doc", "docx"],
            hre.ethers.parseEther("0"),
            Math.floor(Date.now() / 1000) + 2000
          )
      ).to.be.revertedWithCustomError(contract, "MissingParams");

      // With a wrong timestamp
      await expect(
        contract.connect(owner).createRequest(
          "Simple description",
          ["pdf", "doc", "docx"],
          hre.ethers.parseEther("0.2"),
          Math.floor((Date.now() - 86400000) / 1000) // yesterday
        )
      ).to.be.revertedWithCustomError(contract, "WrongExpirationDate");

      // Without file types
      await expect(
        contract
          .connect(owner)
          .createRequest(
            "Simple description",
            [],
            hre.ethers.parseEther("0.2"),
            Math.floor(Date.now() / 1000) + 2000
          )
      ).to.be.revertedWithCustomError(contract, "MissingParams");

      // Cannot get wrong request
      await expect(contract.getRequest(1)).to.be.revertedWithCustomError(
        contract,
        "RequestNotFound"
      );
    });
  });

  describe("Should send a new file", function () {
    it("Should send a file to an open request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const request = await createSimpleRequest(contract, owner);
      const before = await contract.getRequest(0);

      const tx = await contract
        .connect(account1)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Check tx is not reverted
      expect(tx).to.not.be.not.reverted;

      const after = await contract.getRequest(0);
      expect(Number(before[9])).to.be.equal(Number(after[9]) - 1);
    });

    it("Shouldn't send a file without required fields", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const request = await createSimpleRequest(contract, owner);

      // Without filename
      await expect(
        contract
          .connect(account1)
          .sendFileToRequest(request[0], "", "pdf", "Simple PDF", "abc123")
      ).to.be.revertedWithCustomError(contract, "MissingParams");

      // Without format
      await expect(
        contract
          .connect(account1)
          .sendFileToRequest(
            request[0],
            "filename.pdf",
            "",
            "Simple PDF",
            "abc123"
          )
      ).to.be.revertedWithCustomError(contract, "WrongFormat");

      // With a not accepted format
      await expect(
        contract
          .connect(account1)
          .sendFileToRequest(
            request[0],
            "filename.pdf",
            "txt",
            "Simple PDF",
            "abc123"
          )
      ).to.be.revertedWithCustomError(contract, "WrongFormat");
    });
  });

  describe("Get requests", function () {
    it("Should get all requests", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const request = await createSimpleRequest(contract, owner);
      const request2 = await createSimpleRequest(contract, account1);

      const requests = await contract.getRequests();
      expect(requests.length).to.be.equal(2);
    });

    it("Should get only mine requests", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const request = await createSimpleRequest(contract, owner);
      const request2 = await createSimpleRequest(contract, account1);

      const requests = await contract.connect(owner).getMyRequests();
      expect(requests.length).to.be.equal(1);
    });

    it("Shouldn't get not exists request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const request = await createSimpleRequest(contract, owner);

      await expect(contract.getRequest(1)).to.be.revertedWithCustomError(
        contract,
        "RequestNotFound"
      );
    });
  });
});
