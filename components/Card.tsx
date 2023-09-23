import Link from "next/link";
import { CardProps } from "@/utils/interfaces-types";
import { formatTimestamp, returnETH, truncateString } from "@/utils/helpers";

/**
 * Renders a card component for a given demand.
 *
 * @param {CardProps} demand - The demand object containing the title, description, creator, target address, creation date, amount, target amount, and ID.
 * @returns {JSX.Element} - The rendered card component.
 */
const Card = ({ demand }: CardProps) => {
  return (
    <div className="bg-slate-100 p-4 border rounded shadow-md">
      <p className="text-gray-600 mt-2">
        <strong>Request:</strong>
        <br />
        {truncateString(demand.description, 50)}
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
        <strong>Partecipants: </strong>
        <br /> {Number(demand.filesCount)}
      </p>
      <Link
        href={`/requests/${demand.id}`}
        className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        Detail
      </Link>
    </div>
  );
};

export default Card;
