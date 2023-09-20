import { ReactElement, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { NextPageWithLayout } from "./_app";
import Card from "../components/Card";
import { Demand } from "../utils/interfaces-types";
import LoadingSpinner from "../components/LoadingSpinner";
import { getDemands } from "../utils/functions";

const Home: NextPageWithLayout = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    /**
     * Fetches data asynchronously.
     *
     * @return {Promise<void>} Promise that resolves when data is fetched.
     */
    const fetchData = async () => {
      const result: Demand[] = await getDemands("DESC", false, 3);
      setDemands(result);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <main className="container mx-auto">
      {isLoading && <LoadingSpinner />}
      <div className="p-4">
        <h1 className="text-3xl font-semibold text-center mb-4 mt-4">
          FileSolvers
        </h1>
        <p className="text-center text-gray-600 mb-8">
          FileSolvers is a decentralized platform designed to simplify the
          process of requesting and accessing specific files within the Filecoin
          Network.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demands.map((demand, index) => (
            <Card key={index} demand={demand} />
          ))}
        </div>
      </div>
    </main>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Home;
