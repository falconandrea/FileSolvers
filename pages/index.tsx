"use client";

import { ReactElement, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app";
import Card from "@/components/Card";
import { Demand } from "@/utils/interfaces-types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getRequests } from "@/utils/functions";
import Link from "next/link";
import { useAccount } from "wagmi";

const Home: NextPageWithLayout = () => {
  const { address } = useAccount();

  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const fetchData = async () => {
      const data = await getRequests(address, "all", "DESC", false, 3);
      setDemands(data);
      setIsLoading(false);
    };

    fetchData();
  }, [address]);

  return (
    <main className="container mx-auto">
      {isLoading && <LoadingSpinner />}
      <div className="p-4">
        <h1 className="text-3xl font-semibold text-center mb-4 mt-4">
          FileSolvers
        </h1>
        <p className="text-center text-gray-600 mb-8 max-w-xl mx-auto">
          FileSolvers is a decentralized platform designed to simplify the
          process of requesting and accessing specific files within the Filecoin
          Network.
          <span className="hidden md:inline-block">
            <br />
            Our goal is to connect users seeking particular files with providers
            who can fulfill those requests in a seamless and secure manner.
          </span>
        </p>

        <div className="p-4 py-8">
          <h3 className="text-xl text-center font-semibold mb-8">
            Last 3 active requests
          </h3>
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

        <div className="text-center mt-16 mb-8">
          <h4 className="font-semibold text-xl">
            Need a File? Create a Request!
          </h4>
          <Link
            href="/create"
            title="Crete a new request"
            className="bg-blue-500 inline-block hover:bg-blue-600 text-white px-4 py-2 rounded mt-4"
          >
            Create a Request
          </Link>
        </div>
      </div>
    </main>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Home;
