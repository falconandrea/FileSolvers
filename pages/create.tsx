"use client";

import { ReactElement, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAccount, useNetwork } from "wagmi";
import { createRequest } from "@/utils/functions";
import { parseErrors } from "@/utils/helpers";
import TransactionLink from "@/components/TransactionLink";
import MessageAlert from "@/components/MessageAlert";
import { acceptedFormats } from "@/utils/mapping";

const Create: NextPageWithLayout = () => {
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hash, setHash] = useState<string>("");
  const [messageAlert, setMessageAlert] = useState<string>("");
  const [messageStatus, setMessageStatus] = useState<"success" | "error">(
    "success"
  );

  // Format fields
  const [description, setDescription] = useState<string>("");
  const [formats, setFormats] = useState<string[]>([]);
  const [reward, setReward] = useState<string>("0.01");
  const [expirationDate, setExpirationDate] = useState<string>(
    new Date().toISOString()
  );

  useEffect(() => {
    setShowForm(isConnected && chain && chain.name == "Sepolia" ? true : false);
  }, [isConnected, address, chain]);

  /**
   * Handles the form submission asynchronously.
   *
   * @param {React.FormEvent} e - The form event object.
   * @return {Promise<void>} - A promise that resolves once the form submission is handled.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageAlert("");
    setMessageStatus("success");
    setIsLoading(true);

    try {
      const { result, hash } = await createRequest(
        description,
        formats,
        reward,
        expirationDate
      );
      setHash(hash);

      setMessageAlert("Transaction sent");

      // Reset form
      setDescription("");
      setFormats([]);
      setExpirationDate("");
      setReward("");
    } catch (error: any) {
      setMessageStatus("error");
      setMessageAlert(parseErrors(error.toString()));
    }

    setIsLoading(false);
  };

  return (
    <main className="container mx-auto">
      {isLoading && <LoadingSpinner />}
      <MessageAlert message={messageAlert} messageStatus={messageStatus} />
      {showForm ? (
        <div className="py-16 px-4 max-w-xl mx-auto">
          <div className="bg-slate-100 p-4 border rounded">
            <h1 className="text-3xl font-semibold mb-4">
              Create a new request
            </h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-600">Description</label>
                <textarea
                  name="description"
                  value={description}
                  className="w-full p-2 border rounded resize-none"
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600">
                  Accepted file formats
                </label>
                <select
                  name="formats"
                  value={formats}
                  onChange={(e) => {
                    let array = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setFormats(array);
                  }}
                  className="w-full p-2 border rounded"
                  required
                  style={{ height: "350px" }}
                  multiple
                >
                  {acceptedFormats.map((format) => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600">Expiration date</label>
                <input
                  type="date"
                  name="expirationDate"
                  value={expirationDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600">Reward in ETH</label>
                <input
                  type="number"
                  name="reward"
                  value={reward}
                  step={"0.01"}
                  min={0.01}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send request
              </button>
            </form>
            <TransactionLink hash={hash} />
          </div>
        </div>
      ) : (
        <div className="py-16 px-4 max-w-xl mx-auto">
          <div className="bg-slate-100 p-4 border rounded py-8">
            <p className="text-center text-gray-600">
              You have to be logged to create a new request
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

Create.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Create;
