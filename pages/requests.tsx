"use client";

import { ReactElement, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app";
import Card from "@/components/Card";
import { Demand } from "@/utils/interfaces-types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getRequests } from "@/utils/functions";
import { useAccount } from "wagmi";

const Requests: NextPageWithLayout = () => {
  const { address } = useAccount();

  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setIsLoading(true);

    const fetchData = async () => {
      let data;
      if (filter == "mine") {
        data = await getRequests(address, "mine", "DESC", true);
      } else if (filter == "active") {
        data = await getRequests(address, "all", "DESC", false);
      } else {
        data = await getRequests(address, "all", "DESC", true);
      }
      setDemands(data);
      setIsLoading(false);
    };

    fetchData();
  }, [filter]);

  return (
    <main className="container mx-auto">
      {isLoading && <LoadingSpinner />}
      <div className="p-4">
        <h1 className="text-3xl font-semibold text-center mb-4 mt-4">
          All requests
        </h1>

        <div className="text-right mr-4">
          <div className="">
            <label htmlFor="filterIsDone" className="text-sm p-2 mr-2">
              Show:
            </label>
            <select
              name="filterIsDone"
              id="filterIsDone"
              className="border p-2"
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Requests active</option>
              <option value="mine">Requests created by me</option>
            </select>
          </div>
        </div>

        <div className="p-4">
          {demands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demands.map((demand, index) => (
                <Card key={index} demand={demand} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No active requests at the moment
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

Requests.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Requests;
