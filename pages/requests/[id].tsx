"use client";

import { ReactElement, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAccount, useNetwork } from "wagmi";
import { getRequest, sendFileToRequest, uploadFile } from "@/utils/functions";
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

  const [isTheAuthor, setIsTheAuthor] = useState<boolean>(false);
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
      if (demand.author === address) {
        setIsTheAuthor(true);
      } else {
        setIsTheAuthor(false);
      }

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

  useEffect(() => {
    if (router.isReady) {
      setIsLoading(true);
      const id = parseInt(router.query.id as string);
      setRequestId(id);

      getRequestData(id);
      setIsLoading(false);
    }
  }, [router.isReady, address]);

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
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">Loading...</p>
          )}
        </div>
      </div>

      <div className="py-8 px-4 max-w-xl mx-auto">
        <div className="bg-slate-100 p-4 border rounded py-8">
          {showForm ? (
            <div className="px-4 max-w-xl mx-auto">
              {!isTheAuthor && !alreadyParticipated && (
                <form
                  onSubmit={handleSubmit}
                  method="POST"
                  encType="multipart/form-data"
                >
                  <h4 className="text-xl font-semibold mb-4">Upload a file</h4>
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
                      File (accepted formats:
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
              {isTheAuthor && (
                <p className="text-center text-gray-600">
                  You are the author, you cannot upload a file
                </p>
              )}
              {alreadyParticipated && (
                <p className="text-center text-gray-600">
                  You have already participated in this request
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              You have to be logged to upload a file
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
