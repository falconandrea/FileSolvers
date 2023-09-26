"use client";

import { ReactElement, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAccount, useNetwork } from "wagmi";
import {
  chooseTheWinner,
  getRequest,
  sendFileToRequest,
  uploadFile,
  withdrawReward,
} from "@/utils/functions";
import {
  checkFormatIsAccepted,
  formatTimestamp,
  parseErrors,
  returnETH,
} from "@/utils/helpers";
import TransactionLink from "@/components/TransactionLink";
import MessageAlert from "@/components/MessageAlert";
import { useRouter } from "next/router";
import { Demand, ParticipantFile, RequestFile } from "@/utils/interfaces-types";
import PrintAddress from "@/components/PrintAddress";
import { mappingFormats } from "@/utils/mapping";
import { zeroAddress } from "viem";

const Detail: NextPageWithLayout = () => {
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hash, setHash] = useState<string>("");
  const [messageAlert, setMessageAlert] = useState<string>("");
  const [messageStatus, setMessageStatus] = useState<"success" | "error">(
    "success"
  );

  const [description, setDescription] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File>();

  const [demand, setDemand] = useState<Demand>();
  const [files, setFiles] = useState<ParticipantFile[]>([]);
  const [requestId, setRequestId] = useState<number>(-1);
  const router = useRouter();

  const [alreadyParticipated, setAlreadyParticipated] =
    useState<boolean>(false);

  /**
   * Retrieves request data based on the provided ID.
   *
   * @param {number} id - The ID of the request to retrieve data for.
   * @return {Promise<void>} - A promise that resolves when the request data has been retrieved and processed.
   */
  const getRequestData = async (id: number) => {
    try {
      const [demand, files]: [Demand, ParticipantFile[]] = await getRequest(id);
      setDemand(demand);
      setFiles(files);

      // Check if user had already submitted a file
      let canParticipate = true;
      if (files.length > 0) {
        for (const file of files) {
          if (file.author == address) canParticipate = false;
        }
      }
      if (canParticipate) setAlreadyParticipated(false);
      else setAlreadyParticipated(true);
    } catch (error: any) {
      setMessageStatus("error");
      setMessageAlert(parseErrors(error.toString()));
    }
  };

  /**
   * Chooses the winner based on the fileId.
   *
   * @param {number} fileId - The id of the file.
   * @return {Promise<void>} - A promise that resolves when the winner is chosen.
   */
  const chooseWinner = async (fileId: number) => {
    try {
      const { result, hash } = await chooseTheWinner(requestId, fileId);
      setHash(hash);
      setMessageStatus("success");
      setMessageAlert("Winner chosen");
    } catch (error: any) {
      setMessageStatus("error");
      setMessageAlert(parseErrors(error.toString()));
    }
  };

  /**
   * Takes back the reward.
   *
   * @return {Promise<void>} Nothing is returned.
   */
  const takeBackTheReward = async () => {
    try {
      const { result, hash } = await withdrawReward(requestId);
      setHash(hash);
      setMessageStatus("success");
      setMessageAlert("Reward withdrawn");
    } catch (error: any) {
      setMessageStatus("error");
      setMessageAlert(parseErrors(error.toString()));
    }
  };

  useEffect(() => {
    if (router.isReady) {
      setIsLoading(true);
      const id = parseInt(router.query.id as string);
      setRequestId(id);

      getRequestData(id);
      setIsLoading(false);
    }
  }, [router.isReady, address, router.query.id]);

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
      // Check file is valid
      if (!uploadedFile) {
        throw new Error("NoFileSelected");
      }

      // Check format is accepted
      if (!checkFormatIsAccepted(demand?.formatsAccepted, uploadedFile.type)) {
        throw new Error("InvalidFileFormat");
      }

      // Check file size is under 10Mb
      if (uploadedFile.size > 10 * 1024 * 1024) {
        throw new Error("FileTooBig");
      }

      // Upload file on FileCoin
      const cid: string = await uploadFile(uploadedFile);
      const file: RequestFile = {
        cid,
        fileName: uploadedFile.name,
        format: mappingFormats[uploadedFile.type],
      };

      // Send file to request
      const { result, hash } = await sendFileToRequest(
        file,
        requestId,
        description
      );
      setHash(hash);
      setMessageAlert("File uploaded");

      // Reset form
      setDescription("");
      setUploadedFile(undefined);
    } catch (error: any) {
      console.log(error);
      setMessageStatus("error");
      setMessageAlert(parseErrors(error.toString()));
    }

    setIsLoading(false);
  };

  return (
    <main className="container mx-auto">
      {isLoading && <LoadingSpinner />}
      <MessageAlert message={messageAlert} messageStatus={messageStatus} />

      <div className="pt-4 pb-4 px-4 max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold text-center mb-8 mt-4">
          Detail request
        </h1>
        <div className="bg-slate-100 p-4 border rounded">
          {demand ? (
            <div className="mb-8">
              <p className="text-gray-600 mt-2">
                <strong>Request:</strong>
                <br />
                {demand.description}
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Creator:</strong>
                <br />
                <PrintAddress address={demand.author}></PrintAddress>
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Accepted formats: </strong>
                <br />
                {demand.formatsAccepted.join(", ")}
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Expiration Date: </strong>
                <br /> {formatTimestamp(demand.expirationDate)}
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Reward: </strong>
                <br /> {returnETH(demand.reward)}
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Participants: </strong>
                <br /> {Number(demand.filesCount)}
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Status: </strong>
                <br /> {demand.isDone ? "Expired" : "Active"}
              </p>
              {demand.isDone && (
                <p className="text-gray-600 mt-2">
                  <strong>Winner: </strong>
                  <br />{" "}
                  {demand.winner != zeroAddress ? (
                    <PrintAddress address={demand.winner}></PrintAddress>
                  ) : (
                    "-"
                  )}
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">Loading...</p>
          )}
        </div>
      </div>

      <div className="py-8 px-4 max-w-xl mx-auto">
        <div className="bg-slate-100 p-4 border rounded py-8">
          {showForm && demand ? (
            <div className="px-4 max-w-xl mx-auto">
              {/* You are not the author, the request is not expired and you have not participated */}
              {demand.author !== address &&
                !alreadyParticipated &&
                !demand.isDone && (
                  <form
                    onSubmit={handleSubmit}
                    method="POST"
                    encType="multipart/form-data"
                  >
                    <h4 className="text-xl font-semibold mb-4">
                      Upload a file
                    </h4>
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
                        File (accepted formats:{" "}
                        {demand?.formatsAccepted.join(", ")}) - Max 10MB
                      </label>
                      <input
                        type="file"
                        name="uploadedFile"
                        onChange={(e) => setUploadedFile(e.target.files![0])}
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Send
                    </button>
                    <TransactionLink hash={hash} />
                  </form>
                )}

              {/* You are the author and the request is not expired */}
              {demand.author === address && !demand.isDone && (
                <p className="text-center text-gray-600">
                  You are the author, you cannot upload a file. <br />
                  When the request expires, you will be able to choose the
                  winner or take back the amount paid if no one participated.
                </p>
              )}

              {/* You are the author, the request is expired and you have not chosen the winner */}
              {demand.author === address &&
                demand.isDone &&
                demand.winner === zeroAddress && (
                  <div>
                    <h4 className="text-xl font-semibold mb-4">
                      Choose the winner
                    </h4>
                    {files.length > 0 ? (
                      <div>
                        <p className="text-gray-600">
                          Here you have all the files of the participants, you
                          have to choose the winner!
                        </p>
                        {files.map((file, index) => (
                          <div
                            className="border border-gray-500 p-2 mt-4"
                            key={index}
                          >
                            <p>
                              <strong>Filename: </strong>
                              <a
                                href={`https://gateway.lighthouse.storage/ipfs/${file.cid}`}
                                title=""
                                className="underline"
                                target="_blank"
                              >
                                {file.fileName}
                              </a>
                            </p>
                            <p>
                              <strong>Description: </strong>
                              {file.description}
                            </p>
                            <p>
                              <strong>Format: </strong>
                              {file.format}
                            </p>
                            <p>
                              <strong>Author: </strong>
                              <PrintAddress
                                address={file.author}
                              ></PrintAddress>
                            </p>
                            <button
                              onClick={() => chooseWinner(Number(file.id))}
                              className="bg-blue-500 mt-2 text-white px-2 py-1 text-sm rounded hover:bg-blue-600"
                            >
                              Choose this
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600">
                          Unfortunately, there are no participants. Click here
                          to take back your amount.
                        </p>
                        <button
                          onClick={() => takeBackTheReward()}
                          className="bg-blue-500 mt-2 text-white px-2 py-1 text-sm rounded hover:bg-blue-600"
                        >
                          Take back
                        </button>
                        <TransactionLink hash={hash} />
                      </div>
                    )}
                    <TransactionLink hash={hash} />
                  </div>
                )}

              {/* You are not the author and you have already participated */}
              {alreadyParticipated && (
                <p className="text-center text-gray-600">
                  You have already participated in this request.
                </p>
              )}

              {/* You are not the author and the request is expired and waiting for a winner */}
              {demand.author !== address &&
                demand.isDone &&
                demand.winner == zeroAddress && (
                  <p className="text-center text-gray-600">
                    Request is expired,{" "}
                    {demand.filesCount > 0
                      ? "we are wating to know who is the winner"
                      : "no one participated"}
                    .
                  </p>
                )}

              {/* You are not the author and the request is expired and we have a winner */}
              {demand.isDone && demand.winner !== zeroAddress && (
                <p className="text-center text-gray-600">
                  Request completed with a chosen winner.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              You have to be logged to upload a file.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

Detail.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Detail;
