const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
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
        Math.floor(Date.now() / 1000) + 2000,
        {
          value: hre.ethers.parseEther("0.1"),
        }
      );

    // Get request and files
    const [request, files] = await contract.getRequest(0);

    return [request, files];
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

      // Get contract balance before
      const balanceBefore = await hre.ethers.provider.getBalance(
        contract.target
      );

      // Create new request
      const tx = await contract
        .connect(owner)
        .createRequest(
          "Simple description",
          ["pdf", "doc", "docx"],
          Math.floor(Date.now() / 1000) + 2000,
          {
            value: hre.ethers.parseEther("0.1"),
          }
        );

      // Check tx is not reverted
      expect(tx).to.not.be.not.reverted;

      // Get contract balance after
      const balanceAfter = await hre.ethers.provider.getBalance(
        contract.target
      );

      // Get request created
      const [request] = await contract.getRequest(0);
      expect(Number(request[0])).to.be.equal(0);

      // Check balance
      expect(balanceBefore + hre.ethers.parseEther("0.1")).to.be.equal(
        balanceAfter
      );
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
            Math.floor(Date.now() / 1000) + 2000,
            {
              value: hre.ethers.parseEther("0.1"),
            }
          )
      ).to.be.revertedWithCustomError(contract, "MissingParams");

      // Without file types
      await expect(
        contract
          .connect(owner)
          .createRequest(
            "Simple description",
            [],
            Math.floor(Date.now() / 1000) + 2000,
            {
              value: hre.ethers.parseEther("0.2"),
            }
          )
      ).to.be.revertedWithCustomError(contract, "MissingParams");
    });
    it("Shouldn't create new request with a wrong expiration date", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // With a wrong expiration date
      await expect(
        contract
          .connect(owner)
          .createRequest(
            "Test",
            ["pdf", "doc", "docx"],
            Math.floor(Date.now() / 1000) - 2000,
            {
              value: hre.ethers.parseEther("0.1"),
            }
          )
      ).to.be.revertedWithCustomError(contract, "WrongExpirationDate");
    });
    it("Shouldn't create new request with a wrong amount", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // With a wrong amount
      await expect(
        contract
          .connect(owner)
          .createRequest(
            "Simple description",
            ["pdf", "doc", "docx"],
            Math.floor(Date.now() / 1000) + 2000,
            {
              value: hre.ethers.parseEther("0"),
            }
          )
      ).to.be.revertedWithCustomError(contract, "AmountLessThanZero");
    });
  });

  describe("Should send a new file", function () {
    it("Should send a file to an open request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);
      const [before] = await contract.getRequest(0);

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

      const [after, files] = await contract.getRequest(0);
      expect(Number(before[10])).to.be.equal(Number(after[10]) - 1);

      expect(files[0][1]).to.be.equal("test.pdf");
    });

    it("Shouldn't send a file if you are the author", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      await expect(
        contract
          .connect(owner)
          .sendFileToRequest(
            request[0],
            "test.pdf",
            "pdf",
            "Simple PDF",
            "abc123"
          )
      ).to.be.revertedWithCustomError(contract, "YouCantParticipate");
    });

    it("Shouldn't send a file without required fields", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

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

    it("Shouldn't send a file twice", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);
      const [before] = await contract.getRequest(0);

      const tx = await contract
        .connect(account1)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // With a not accepted format
      await expect(
        contract
          .connect(account1)
          .sendFileToRequest(
            request[0],
            "filename2.pdf",
            "pdf",
            "Second PDF",
            "abc123123"
          )
      ).to.be.revertedWithCustomError(contract, "AlreadyParticipated");
    });
  });

  describe("Get requests", function () {
    it("Should get all requests", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);
      const [request2] = await createSimpleRequest(contract, account1);

      const requests = await contract.getRequests();
      expect(requests.length).to.be.equal(2);
    });

    it("Should get only mine requests", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      const mine = await contract.connect(owner).getMyRequests();
      expect(mine.length).to.be.equal(1);

      // Create new request not mine
      const [request2] = await createSimpleRequest(contract, account1);

      const mine2 = await contract.connect(owner).getMyRequests();
      expect(mine2.length).to.be.equal(1);
    });

    it("Shouldn't get not exists request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      await expect(contract.getRequest(1)).to.be.revertedWithCustomError(
        contract,
        "RequestNotFound"
      );
    });
  });

  describe("Expired requests", function () {
    it("Should request expired", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      await contract.closeExpiredRequest();

      const [requestAfter] = await contract.getRequest(0);
      expect(request[2]).to.be.false;
      expect(requestAfter[2]).to.be.true;
    });

    it("Shouldn't send file to expired request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      await contract.closeExpiredRequest();

      // Send file
      await expect(
        contract.sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        )
      ).to.be.revertedWithCustomError(contract, "RequestClosed");
    });
  });

  describe("Withdraw reward from a request", function () {
    it("Should withdraw reward from a request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Get contract balance and user balance before closing
      const balanceContractBefore = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserBefore = await hre.ethers.provider.getBalance(
        owner.address
      );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Withdraw reward
      const tx = await contract.withdrawReward(request[0]);
      expect(tx).to.not.be.not.reverted;

      // Get contract balance and user balance after closing
      const balanceContractAfter = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserAfter = await hre.ethers.provider.getBalance(
        owner.address
      );

      // Check balances
      expect(balanceContractAfter).to.be.equal(
        balanceContractBefore - hre.ethers.parseEther("0.1")
      );

      expect(balanceUserAfter).to.be.greaterThan(
        balanceUserBefore + hre.ethers.parseEther("0.09")
      );
    });
    it("Should withdraw reward from a request if you are the owner", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, account1);

      // Get contract balance and user balance before closing
      const balanceContractBefore = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserBefore = await hre.ethers.provider.getBalance(
        account1.address
      );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Withdraw reward
      const tx = await contract.withdrawReward(request[0]);
      expect(tx).to.not.be.not.reverted;

      // Get contract balance and user balance after closing
      const balanceContractAfter = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserAfter = await hre.ethers.provider.getBalance(
        account1.address
      );

      // Check balances
      expect(balanceContractAfter).to.be.equal(
        balanceContractBefore - hre.ethers.parseEther("0.1")
      );

      expect(balanceUserAfter).to.be.greaterThan(
        balanceUserBefore + hre.ethers.parseEther("0.09")
      );
    });
    it("Shouldn't withdraw reward from a request twice", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Withdraw reward
      const tx = await contract.withdrawReward(request[0]);
      expect(tx).to.not.be.not.reverted;

      // Revert Withdraw reward
      await expect(
        contract.withdrawReward(request[0])
      ).to.be.revertedWithCustomError(contract, "AlreadyWithdraw");
    });
    it("Shouldn't withdraw reward from a active request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Revert Withdraw reward
      await expect(
        contract.withdrawReward(request[0])
      ).to.be.revertedWithCustomError(contract, "RequestNotClosed");
    });
    it("Shouldn't withdraw reward from a request with participants", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Send file
      await contract
        .connect(account1)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      await contract.closeExpiredRequest();

      // Revert Withdraw reward
      await expect(
        contract.withdrawReward(request[0])
      ).to.be.revertedWithCustomError(contract, "HaveToChooseWinner");
    });
    it("Shouldn't withdraw reward from a not yours request", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      await contract.closeExpiredRequest();

      // Revert Withdraw reward
      await expect(
        contract.connect(account2).withdrawReward(request[0])
      ).to.be.revertedWithCustomError(contract, "YouAreNotTheAuthor");
    });
  });

  describe("Choose a winner", function () {
    it("Should choose a winner and send reward", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Send file
      await contract
        .connect(account1)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Get contract balance and user balance before closing
      const balanceContractBefore = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserBefore = await hre.ethers.provider.getBalance(
        account1.address
      );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Choose a participant
      const tx = await contract.connect(owner).chooseWinner(request[0], 0);
      expect(tx).to.be.not.reverted;

      // Get contract balance and user balance before closing
      const balanceContractAfter = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserAfter = await hre.ethers.provider.getBalance(
        account1.address
      );

      // Check balances
      expect(balanceContractAfter).to.be.equal(
        balanceContractBefore - hre.ethers.parseEther("0.1")
      );

      expect(balanceUserAfter).to.be.greaterThan(
        balanceUserBefore + hre.ethers.parseEther("0.09")
      );
    });
    it("Shouldn't choose a winner twice", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, owner);

      // Send file
      await contract
        .connect(account1)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Get contract balance and user balance before closing
      const balanceContractBefore = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserBefore = await hre.ethers.provider.getBalance(
        account1.address
      );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Choose a participant
      const tx = await contract.connect(owner).chooseWinner(request[0], 0);
      expect(tx).to.be.not.reverted;

      // Get contract balance and user balance before closing
      const balanceContractAfter = await hre.ethers.provider.getBalance(
        contract.target
      );
      const balanceUserAfter = await hre.ethers.provider.getBalance(
        account1.address
      );

      // Check balances
      expect(balanceContractAfter).to.be.equal(
        balanceContractBefore - hre.ethers.parseEther("0.1")
      );

      expect(balanceUserAfter).to.be.greaterThan(
        balanceUserBefore + hre.ethers.parseEther("0.09")
      );

      // Choose a participant
      await expect(
        contract.connect(owner).chooseWinner(request[0], 0)
      ).to.be.revertedWithCustomError(contract, "AlreadyHaveAWinner");

      const balanceUserAfter2 = await hre.ethers.provider.getBalance(
        account1.address
      );

      // User balance don't change
      expect(balanceUserAfter).to.be.equal(balanceUserAfter2);
    });
    it("Should choose a winner only the author or the owner", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, account1);

      // Send file
      await contract
        .connect(account2)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Account 2 try to Choose a participant -> fail
      await expect(
        contract.connect(account2).chooseWinner(request[0], 0)
      ).to.be.revertedWithCustomError(contract, "YouAreNotTheAuthor");

      // The owner can Choose a participant
      const tx = await contract.connect(owner).chooseWinner(request[0], 0);
      expect(tx).to.be.not.reverted;
    });
    it("Shouldn't choose a winner if the request is active", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, account1);

      // Send file
      await contract
        .connect(account2)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Try to choose a winner
      await expect(
        contract.connect(account2).chooseWinner(request[0], 0)
      ).to.be.revertedWithCustomError(contract, "RequestNotClosed");
    });
    it("Shouldn't choose a winner if there are no participants", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, account1);

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Try to choose a winner
      await expect(
        contract.connect(account1).chooseWinner(request[0], 0)
      ).to.be.revertedWithCustomError(contract, "NoParticipants");
    });
    it("Shouldn't choose a winner with a wrong file", async function () {
      const { contract, owner, account1, account2 } = await loadFixture(
        deployFixture
      );

      // Create new request
      const [request] = await createSimpleRequest(contract, account1);

      // Send file
      await contract
        .connect(account2)
        .sendFileToRequest(
          request[0],
          "test.pdf",
          "pdf",
          "Simple PDF",
          "abc123"
        );

      // Move 2 days in the future after the expiration date
      await helpers.time.increase(2 * 24 * 60 * 60);

      // Close request without participants
      await contract.closeExpiredRequest();

      // Try to choose a wrong file
      await expect(
        contract.connect(account1).chooseWinner(request[0], 1)
      ).to.be.revertedWithCustomError(contract, "FileNotFound");
    });
  });
});
