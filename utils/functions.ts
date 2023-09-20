import { readContract } from "@wagmi/core";
import { Demand } from "./interfaces-types";
import fileSolvers from "../abi/FileSolvers.json";

/**
 * Retrieves all the demands
 *
 * @param {string} sortOrder - The order in which the demands should be sorted. Default is "ASC".
 * @param {boolean} withCompleted - Whether to include completed demands in the result. Default is true.
 * @param {number} limit - The maximum number of demands to retrieve. Default is 0 (retrieve all).
 * @return {Demand[] | null} An array of demands or null if no demands are found.
 */
export const getDemands = async (
  sortOrder: "ASC" | "DESC" = "ASC",
  withCompleted: boolean = true,
  limit: number = 0
): Promise<Demand[]> => {
  const data =
    ((await readContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: fileSolvers.abi,
      functionName: "getDonations",
      args: [],
    })) as Demand[]) || null;

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
