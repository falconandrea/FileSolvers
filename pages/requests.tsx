"use client";

import { ReactElement, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app";
import Card from "@/components/Card";
import { Demand } from "@/utils/interfaces-types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getRequests } from "@/utils/functions";

const Requests: NextPageWithLayout = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const fetchData = async () => {
      const data = await getRequests("DESC", false, 3);
      setDemands(data);
      console.log(data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <main className="container mx-auto">
      {isLoading && <LoadingSpinner />}
      <div className="p-4">
        <h1 className="text-3xl font-semibold text-center mb-4 mt-4">
          All requests
        </h1>

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
