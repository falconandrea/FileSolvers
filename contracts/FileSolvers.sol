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
    error JustPartecipated();
    error AmountLessThanZero();

    constructor() {
        owner = msg.sender;
    }

    /**
     * Create a new request
     * @param description - description of the request
     * @param formatsAccepted - array with file formats accepted
     * @param expirationDate - expiration date for the request
     */
    function createRequest(
        string calldata description,
        string[] calldata formatsAccepted,
        uint expirationDate
    ) external payable {
        uint256 reward = msg.value;

        if (reward <= 0) revert AmountLessThanZero();
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
     * Check if address in inside array
     * @param array - array where we want to check
     * @param value - value we want to check
     */
    function includes(
        address[] memory array,
        address value
    ) internal pure returns (bool) {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == value) return true;
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
        if (includes(requestPartecipants[id], msg.sender))
            revert JustPartecipated();

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

    /**
     * Return the request required with its files
     * @param id - id of the request
     */
    function getRequest(
        uint id
    ) external view returns (Request memory, File[] memory) {
        if (id >= countRequests) revert RequestNotFound();
        File[] memory tempFiles = new File[](requestFiles[id].length);
        for (uint i = 0; i < requestFiles[id].length; i++) {
            tempFiles[i] = files[requestFiles[id][i]];
        }
        return (requests[id], tempFiles);
    }

    /**
     * Return all the requests
     */
    function getRequests() external view returns (Request[] memory) {
        Request[] memory result = new Request[](countRequests);
        for (uint i = 0; i < countRequests; i++) {
            result[i] = requests[i];
        }
        return result;
    }

    /**
     * Return all my requests
     */
    function getMyRequests() external view returns (Request[] memory) {
        // Count how many requests I have
        uint myRequests = 0;
        for (uint i = 0; i < countRequests; i++) {
            if (
                keccak256(abi.encode(msg.sender)) ==
                keccak256(abi.encode(requests[i].author))
            ) {
                myRequests++;
            }
        }

        // Return my requests
        Request[] memory result = new Request[](myRequests);
        uint j = 0;
        for (uint i = 0; i < countRequests; i++) {
            if (
                keccak256(abi.encode(msg.sender)) ==
                keccak256(abi.encode(requests[i].author))
            ) {
                result[j] = requests[i];
                j++;
            }
        }
        return result;
    }
}
