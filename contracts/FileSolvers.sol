// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "hardhat/console.sol";

contract FileSolvers {
    struct Request {
        uint id;
        string description;
        bool isDone;
        address author;
        address winner;
        string[] formatsAccepted;
        uint reward;
        uint creationDate;
        uint expirationDate;
        uint filesCount;
        uint winnerFile;
    }
    struct File {
        uint id;
        string fileName;
        string format;
        string description;
        string cid;
        address author;
        uint creationDate;
    }
    uint countRequests;
    uint countFiles;
    mapping(uint => Request) requests;
    mapping(uint => File) files;
    mapping(uint => address[]) requestPartecipants;
    mapping(uint => uint[]) requestFiles;
    address owner;

    error WrongExpirationDate();
    error RequestNotFound();
    error WrongFormat();
    error MissingParams();
    error RequestClosed();

    constructor() {
        owner = msg.sender;
    }

    /**
     * Create a new request
     * @param description - description of the request
     * @param formatsAccepted - array with file formats accepted
     * @param reward - reward for the winner
     * @param expirationDate - expiration date for the request
     */
    function createRequest(
        string calldata description,
        string[] calldata formatsAccepted,
        uint reward,
        uint expirationDate
    ) external {
        if (reward <= 0) revert MissingParams();
        if (formatsAccepted.length == 0) revert MissingParams();
        if (bytes(description).length == 0) revert MissingParams();
        uint currentTimestamp = block.timestamp;
        if (expirationDate <= currentTimestamp) revert WrongExpirationDate();
        Request memory request = Request(
            countRequests,
            description,
            false,
            msg.sender,
            address(0),
            formatsAccepted,
            reward,
            currentTimestamp,
            expirationDate,
            0,
            0
        );
        requests[countRequests] = request;
        countRequests++;
    }

    /**
     * Return the request required
     * @param id - id of the request
     */
    function getRequest(uint id) external view returns (Request memory) {
        if (id >= countRequests) revert RequestNotFound();
        return requests[id];
    }

    /**
     * Internal function to check the format is accepted
     * @param id - id of the request
     * @param formatToCheck - format to check
     */
    function checkFormat(
        uint id,
        string calldata formatToCheck
    ) internal view returns (bool) {
        Request memory request = requests[id];
        string[] memory formatsAccepted = request.formatsAccepted;
        for (uint i = 0; i < formatsAccepted.length; i++) {
            if (
                keccak256(abi.encode(formatsAccepted[i])) ==
                keccak256(abi.encode(formatToCheck))
            ) return true;
        }
        return false;
    }

    /**
     * Send a file to a request
     * @param id - id of the request
     * @param fileName - name of the file
     * @param format - format of the file
     * @param description - description of the file
     * @param cid - cid of the file
     */
    function sendFileToRequest(
        uint id,
        string calldata fileName,
        string calldata format,
        string calldata description,
        string calldata cid
    ) external {
        // Checks
        if (id >= countRequests) revert RequestNotFound();
        Request memory request = requests[id];
        if (request.isDone) revert RequestClosed();
        if (bytes(fileName).length == 0) revert MissingParams();
        if (bytes(cid).length == 0) revert MissingParams();
        if (bytes(description).length == 0) revert MissingParams();
        if (!checkFormat(id, format)) revert WrongFormat();

        // Save file
        File memory file = File(
            countFiles,
            fileName,
            format,
            description,
            cid,
            msg.sender,
            block.timestamp
        );
        files[countFiles] = file;
        requestPartecipants[id].push(msg.sender);
        requestFiles[id].push(countFiles);
        requests[id].filesCount++;
        countFiles++;
    }
}
