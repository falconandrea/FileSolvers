import {
  readContract,
  prepareWriteContract,
  writeContract,
  waitForTransaction,
} from "@wagmi/core";
import { Demand } from "./interfaces-types";
import fileSolvers from "../abi/FileSolvers.json";
import { parseEther } from "viem";
import { getTimestampFromDate } from "./helpers";

/**
 * Retrieves all the demands
 *
 * @param {string} sortOrder - The order in which the demands should be sorted. Default is "ASC".
 * @param {boolean} withCompleted - Whether to include completed demands in the result. Default is true.
 * @param {number} limit - The maximum number of demands to retrieve. Default is 0 (retrieve all).
 * @return {Demand[] | null} An array of demands or null if no demands are found.
 */
export const getRequests = async (
  sortOrder: "ASC" | "DESC" = "ASC",
  withCompleted: boolean = true,
  limit: number = 0
): Promise<Demand[]> => {
  const data = (await readContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "getRequests",
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
    args: [
      description,
      formatsAccepted,
      parseEther(reward),
      getTimestampFromDate(expirationDate),
    ],
  });
  const { hash } = await writeContract(config);
  const result = await waitForTransaction({
    hash,
  });
  return { result, hash };
};

/**
 * Retrieves a request by its ID.
 *
 * @param {number} id - The ID of the demand to retrieve.
 * @return {Promise<Demand | null>} A Promise that resolves to the retrieved demand, or null if no demand was found.
 */
export const getRequest = async (id: number): Promise<Demand | null> => {
  const data = (await readContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: fileSolvers.abi,
    functionName: "getRequest",
    args: [id],
  })) as Demand;
  return data || null;
};
