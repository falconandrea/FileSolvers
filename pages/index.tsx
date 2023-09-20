import { ReactElement } from "react";
import Layout from "../components/Layout";
import { NextPageWithLayout } from "./_app";
import Card from "../components/Card";

const Home: NextPageWithLayout = () => {
  const latestRequests = [
    {
      id: 1n,
      author: "0x00000",
      winner: null,
      description: "Simple test",
      formatsAccepted: ["pdf", "txt"],
      reward: 1000000000000000000,
      isDone: false,
      creationDate: new Date().getTime(),
      expirationDate: new Date().getTime() + 2000,
      filesCount: 0,
      winnerFile: 0,
    },
  ];

  return (
    <main className="container mx-auto">
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
          {latestRequests.map((demand, index) => (
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
