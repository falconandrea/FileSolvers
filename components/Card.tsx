import Link from "next/link";
import { CardProps } from "../utils/interfaces-types";
import { formatTimestamp, returnETH } from "../utils/helpers";

/**
 * Renders a card component for a given demand.
 *
 * @param {CardProps} demand - The demand object containing the title, description, creator, target address, creation date, amount, target amount, and ID.
 * @returns {JSX.Element} - The rendered card component.
 */
const Card = ({ demand }: CardProps) => {
  return (
    <div className="bg-white p-4 border rounded shadow-md">
      <p className="text-gray-600 mt-2">{demand.description}</p>
      <ul className="text-sm mt-2">
        {demand.formatsAccepted.map((format, formatIndex) => (
          <li key={formatIndex}>{format}</li>
        ))}
      </ul>
      <p className="text-gray-600 mt-2">
        Creazione: {formatTimestamp(demand.creationDate)}
      </p>
      <p className="text-gray-600 mt-2">
        Scadenza: {formatTimestamp(demand.expirationDate)}
      </p>
      <p className="text-gray-600 mt-2">Premio: {returnETH(demand.reward)}</p>
      <Link
        href="/request/{request.id}"
        className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded"
      >
        Dettagli
      </Link>
    </div>
  );
};

export default Card;
