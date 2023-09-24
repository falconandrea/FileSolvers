// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract FileSolvers {
    struct Request {
        uint id;
        string description;
        bool isDone;
        address author;
        address winner;
        string[] formatsAccepted;
        uint reward;
        bool returnReward;
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
    mapping(uint => address[]) requestParticipants;
    mapping(uint => uint[]) requestFiles;
    address owner;

    error WrongExpirationDate();
    error RequestNotFound();
    error WrongFormat();
    error MissingParams();
    error RequestClosed();
    error RequestNotClosed();
    error AlreadyParticipated();
    error AmountLessThanZero();
    error YouAreNotTheAuthor();
    error YouCantParticipate();
    error AlreadyWithdraw();
    error HaveToChooseWinner();
    error NoParticipants();
    error AlreadyHaveAWinner();
    error FileNotFound();

    constructor() {
        owner = msg.sender;
    }

    modifier requestExists(uint id) {
        if (id >= countRequests) revert RequestNotFound();
        _;
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
            false,
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
    ) internal view requestExists(id) returns (bool) {
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
    ) external requestExists(id) {
        // Checks
        Request memory request = requests[id];
        if (request.isDone) revert RequestClosed();
        if (bytes(fileName).length == 0) revert MissingParams();
        if (bytes(cid).length == 0) revert MissingParams();
        if (bytes(description).length == 0) revert MissingParams();
        if (!checkFormat(id, format)) revert WrongFormat();
        if (includes(requestParticipants[id], msg.sender))
            revert AlreadyParticipated();
        if (
            keccak256(abi.encode(msg.sender)) ==
            keccak256(abi.encode(request.author))
        ) revert YouCantParticipate();

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
        requestParticipants[id].push(msg.sender);
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
    ) external view requestExists(id) returns (Request memory, File[] memory) {
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

    /**
     * Close expired requests
     **/
    function closeExpiredRequest() external {
        for (uint i = 0; i < countRequests; i++) {
            if (
                requests[i].isDone == false &&
                requests[i].expirationDate <= block.timestamp
            ) {
                requests[i].isDone = true;
            }
        }
    }

    /**
     * Withdraw reward for closed requests without any participation
     * (the owner can send the reward to the creator)
     **/
    function withdrawReward(uint id) external requestExists(id) {
        // Checks
        Request memory request = requests[id];
        if (!request.isDone) revert RequestNotClosed();
        if (request.returnReward) revert AlreadyWithdraw();
        if (request.filesCount > 0) revert HaveToChooseWinner();
        if (
            (keccak256(abi.encode(msg.sender)) !=
                keccak256(abi.encode(request.author))) &&
            keccak256(abi.encode(msg.sender)) != keccak256(abi.encode(owner))
        ) revert YouAreNotTheAuthor();

        // Set returnReward to true
        requests[id].returnReward = true;

        // Withdraw
        bool result = payable(request.author).send(request.reward);
        require(result, "Withdraw failed");
    }

    /**
     * The author choose the winner for a closed request with participants
     * (in case the author don't choose the winner, the owner will be chosen)
     * @param id - id of the request
     * @param file - file id of the winner
     */
    function chooseWinner(uint id, uint file) external requestExists(id) {
        // Request checks
        Request memory request = requests[id];
        if (!request.isDone) revert RequestNotClosed();
        if (request.filesCount == 0) revert NoParticipants();
        if (
            (keccak256(abi.encode(msg.sender)) !=
                keccak256(abi.encode(request.author))) &&
            (keccak256(abi.encode(msg.sender)) != keccak256(abi.encode(owner)))
        ) revert YouAreNotTheAuthor();
        if (request.winner != address(0)) revert AlreadyHaveAWinner();

        // Check if file is inside request files
        if (file >= countFiles) revert FileNotFound();
        bool found = false;
        for (uint i = 0; i < requestFiles[id].length; i++) {
            if (requestFiles[id][i] == file) {
                found = true;
            }
        }
        if (!found) revert FileNotFound();

        // Get the winner
        address winner = files[file].author;

        // Set the winner
        requests[id].winner = winner;

        // And send the reward
        bool result = payable(winner).send(request.reward);
        require(result, "Send reward failed");
    }
}
