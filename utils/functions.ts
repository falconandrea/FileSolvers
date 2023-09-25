import {
  readContract,
  prepareWriteContract,
  writeContract,
  waitForTransaction,
} from "@wagmi/core";
import { Demand, ParticipantFile, RequestFile } from "./interfaces-types";
import fileSolvers from "../abi/FileSolvers.json";
import { parseEther } from "viem";
import { getTimestampFromDate } from "./helpers";

const lighthouse = require("@lighthouse-web3/sdk");

/**
 * Retrieves all the demands
 *
 * @param {string} sortOrder - The order in which the demands should be sorted. Default is "ASC".
 * @param {boolean} withCompleted - Whether to include completed demands in the result. Default is true.
 * @param {number} limit - The maximum number of demands to retrieve. Default is 0 (retrieve all).
 * @return {Demand[] | null} An array of demands or null if no demands are found.
 */
export const getRequests = async (
  filter: string,
  sortOrder: "ASC" | "DESC" = "ASC",
  withCompleted: boolean = true,
  limit: number = 0
): Promise<Demand[]> => {
  const data = (await readContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: filter == "mine" ? "getMyRequests" : "getRequests",
    args: [],
  })) as Demand[];

  // Filter data by isDone
  const filteredData = withCompleted
    ? data
    : data.filter((demand: Demand) => !demand.isDone);

  // Order data
  if (sortOrder === "DESC") {
    filteredData.sort(
      (a: Demand, b: Demand) => Number(b.creationDate) - Number(a.creationDate)
    );
  }

  // Limit data
  const limitedData = limit > 0 ? filteredData.slice(0, limit) : filteredData;

  return limitedData || null;
};

/**
 * Creates a request with the specified description, file formats accepted, expiration date, and reward.
 *
 * @param {string} description - The description of the request.
 * @param {string[]} formatsAccepted - The file formats accepted by the request.
 * @param {string} reward - The reward of the request.
 * @param {string} expirationDate - The expiration date of the request.
 * @return {object} An object containing the result and hash of the request creation.
 */
export const createRequest = async (
  description: string,
  formatsAccepted: string[],
  reward: string,
  expirationDate: string
) => {
  const config = await prepareWriteContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "createRequest",
    args: [description, formatsAccepted, getTimestampFromDate(expirationDate)],
    value: parseEther(reward),
  });
  const { hash } = await writeContract(config);
  const result = await waitForTransaction({
    hash,
  });
  return { result, hash };
};

/**
 * Retrieves a demand and its associated request files by ID.
 *
 * @param {number} id - The ID of the demand.
 * @return {Promise<[Demand, ParticipantFile[]]>} A promise that resolves to an array containing the demand and its associated request files.
 */
export const getRequest = async (
  id: number
): Promise<[Demand, ParticipantFile[]]> => {
  const [demand, files] = (await readContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "getRequest",
    args: [id],
  })) as [Demand, ParticipantFile[]];
  return [demand, files];
};

/**
 * Uploads a file to FileCoin.
 *
 * @param {File} file - The path where the file will be uploaded.
 * @return {Promise<any>} A promise that resolves with the response from the upload.
 */
export const uploadFile = async (file: File): Promise<any> => {
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_APIKEY;
  const dealParam = {
    num_copies: 1, // max 3
    repair_threshold: null, // default 10 days
    renew_threshold: null, //2880 epoch per day, default 28800, min 240(2 hours)
    miner: ["t017840"], //user miners
    network: "calibration",
  };
  // Both file and folder supported by upload function
  const response = await lighthouse.uploadBuffer(
    file,
    apiKey,
    false,
    dealParam
  );
  return response.data.Hash;
};

/**
 * Sends a file to a request.
 *
 * @param {RequestFile} file - The file to send.
 * @param {number} id - The ID of the request.
 * @param {string} description - The description of the file.
 * @return {Promise<{ result: any, hash: any }>} - The result and hash of the transaction.
 */
export const sendFileToRequest = async (
  file: RequestFile,
  id: number,
  description: string
) => {
  const config = await prepareWriteContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "sendFileToRequest",
    args: [id, file.fileName, file.format, description, file.cid],
  });
  const { hash } = await writeContract(config);
  const result = await waitForTransaction({
    hash,
  });
  return { result, hash };
};

/**
 * A function that chooses the winner based on the provided request id and file number.
 *
 * @param {number} id - The id of the winner.
 * @param {number} file - The file number.
 * @return {Promise<{ result: any, hash: string }>} An object containing the result and hash of the transaction.
 */
export const chooseTheWinner = async (id: number, file: number) => {
  const config = await prepareWriteContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "chooseWinner",
    args: [id, file],
  });
  const { hash } = await writeContract(config);
  const result = await waitForTransaction({
    hash,
  });
  return { result, hash };
};

/**
 * A function that chooses the winner based on the provided request id and file number.
 *
 * @param {number} id - The id of the winner.
 * @param {number} file - The file number.
 * @return {Promise<{ result: any, hash: string }>} An object containing the result and hash of the transaction.
 */
export const withdrawReward = async (id: number) => {
  const config = await prepareWriteContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "withdrawReward",
    args: [id],
  });
  const { hash } = await writeContract(config);
  const result = await waitForTransaction({
    hash,
  });
  return { result, hash };
};
